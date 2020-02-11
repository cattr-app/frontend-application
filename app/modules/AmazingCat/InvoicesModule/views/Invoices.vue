<template>
    <div class="invoices">
        <h1 class="page-title">{{ $t('navigation.invoices') }}</h1>

        <div class="controls-row">
            <div class="controls-row__item">
                <multi-select :inputHandler="selectedProjects" :showSelectAll="true" :service="projectService" />
            </div>
            <div class="controls-row__item">
                <user-select @change="onUsersChange" />
            </div>
        </div>

        <div class="at-container">
            <div v-if="Object.keys(invoiceList).length && !isDataLoading">
                <list :invoiceList="invoiceList" @setUserRate="setDefaultUserRate" @setProjectRate="setProjectRate" />
            </div>
            <div v-else class="at-container__inner no-data">
                <preloader v-if="isDataLoading" />
                <span>{{ $t('message.no_data') }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import ProjectService from '@/service/resource/projectService';
import InvoicesService from '../services/InvoicesService';
import MultiSelect from '@/components/MultiSelect';
import UserSelect from '@/components/UserSelect';
import Preloader from '@/components/Preloader';
import List from './Ivoices/List';

export default {
    components: { MultiSelect, UserSelect, List, Preloader },
    data() {
        return {
            invoicesService: new InvoicesService(),
            projectService: new ProjectService(),
            invoiceList: {},
            userIds: [],
            projectIds: [],
            isDataLoading: false
        }
    },
    methods: {
        onUsersChange(uids) {
            this.userIds = uids;
        },
        async getInvoices() {
            this.isDataLoading = true;

            this.invoiceList = (await this.invoicesService
                .getAll({userIds: this.userIds, projectIds: this.projectIds}))
                .data;

            this.isDataLoading = false;
        },
        setProjectRate(rate, userId, projectId) {
            this.invoicesService.setProjectRate({rate, userId, projectId});
        },
        setDefaultUserRate(defaultRate, userId) {
            this.invoicesService.setDefaultRate({defaultRate, userId});
        },
        selectedProjects(values) {
            this.projectIds = values;
            this.getInvoices();
        }
    },
    watch: {
        userIds(preVal, newVal) {
            this.getInvoices();
        },
    },
}
</script>

<style lang="scss" scoped>
    .select {
        padding: 0 1rem 1rem 1rem;
    }
    .no-data {
        text-align: center;
        font-weight: bold;
        position: relative;
    }
    .at-container {
        overflow: hidden;
    }
</style>
