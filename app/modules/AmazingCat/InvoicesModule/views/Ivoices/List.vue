<template>
    <div class="collapse-transition">
        <at-collapse class="list__item" simple>
            <at-collapse-item v-for="(invoice, index) in invoiceList" :key="index">
                <div class="item-header" slot="title" @click="checkDOMPath($event)" :ref="'item-header' + invoice.user.id">
                    <div class="row flex-middle">
                        <div class="col-lg-1 col-md-1 col-xs-1">
                            <user-avatar :user="invoice.user" :size="37"></user-avatar>
                        </div>

                        <div class="col-lg-5 col-md-5 col-xs-5">
                            <span class="h4">{{ invoice.user.full_name }}</span>
                        </div>

                        <div class="col-lg-8 col-md-8 col-xs-8">
                            <span class="h4">{{ $t('navigation.rate-project') }}</span>
                        </div>

                        <div class="col-lg-4 col-md-4 col-xs-4">
                            <span class="h4">{{ $t('navigation.rate') }}</span>
                        </div>

                        <span class="h4">{{ $t('navigation.default-rate') }}</span>
                        
                        <div class="rate-value">
                            <div
                                contenteditable="true"
                                class="invoice-input-original"
                                @keypress="validationValue"
                                @blur="saveUserRate($event, invoice)"
                                @keypress.enter="saveUserRate($event, invoice)"
                                >
                                {{ Number.parseFloat(invoice.default_rate).toFixed(2) }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="closable">
                    <div
                        @mousedown="onCollapse($event, 'item-header' + invoice.user.id)"
                        class="row at-collapse__header"
                        v-for="(project, index) in invoice.projects"
                        :key="index"
                        >
                        <div class="col-lg-offset-6 col-md-offset-6 col-xs-offset-6 col-md-8 col-lg-8 col-xs-8 text-ellipsis">
                            <h5 class="h5 project-name">
                                {{ project.name }}
                            </h5>
                        </div>
                            <div
                                contenteditable="true"
                                class="invoice-input-original"
                                :ref="'input' + invoice.user.id"
                                @blur="saveProjectRate($event, invoice, project)"
                                @keydown.up="focusNext(-1, 'input' + invoice.user.id, index)"
                                @keydown.down="focusNext(1, 'input' + invoice.user.id, index)"
                                @keypress="validationValue"
                            >
                                {{ Number.parseFloat(project.rate).toFixed(2) }}
                            </div>
                    </div>
                </div>
            </at-collapse-item>
        </at-collapse>
    </div>
</template>

<script>

import UserAvatar from '@/components/UserAvatar';

export default {
    components: { UserAvatar },
    props: {
        invoiceList: {},
    },
    data() {
        return {
            currentIndex: 0,
        }
    },
    methods: {
        validationValue(val) {
            const regexp = /^\d+\.\d{0,2}$/;
            const value = val.target.innerText;

            if (!regexp.test(value)) {
                val.stopPropagation();
            }
        },
        onCollapse(event, refName) {
            if (event.target.className.indexOf('project-name') !== -1) {
                return;
            }
            if (event.target.className.indexOf('invoice-input-original') !== -1) {
                return;
            }

            this.$refs[refName][0].click();
        },
        saveUserRate(event, invoice) {
            if (!event.target) {
                return;
            }

            const preRate = Number.parseFloat(event.target.innerText);
            const rate = Number.parseFloat(invoice.default_rate);

            if (!preRate || preRate === rate) {
                event.target.innerText = rate.toFixed(2);
                return;
            }

            this.setUserRate(invoice, preRate);
        },
        saveProjectRate(event, invoice, project) {
            if (!event.target) {
                return;
            }

            const preRate = Number.parseFloat(event.target.innerText);
            const rate = Number.parseFloat(project.rate);

            if (!preRate || preRate === rate) {
                event.target.innerText = rate.toFixed(2);
                return;
            }

            this.setProjectRate(invoice, project, preRate);
        },
        focusNext(factor, input, index) {
            const nextIndex = (index + factor) % this.$refs[input].length;
            const lastIndex = this.$refs[input].length - 1;

            nextIndex > -1
                ? this.$refs[input][nextIndex].focus()
                : this.$refs[input][lastIndex].focus();
        },
        checkDOMPath(event) {
            if (event.target.className.indexOf('invoice-input-original') !== -1) {
                event.stopPropagation();
            }
        },
        setUserRate(invoice, rate) {
            const userId = invoice.user.id;
            invoice.projects.map(project => project.rate ? project.rate : project.rate = rate);

            this.$emit('setUserRate', rate, userId);
            this.$set(invoice, 'default_rate', rate);
        },
        setProjectRate(invoice, project, rate) {
            const userId = invoice.user.id;
            const projectId = project.id;

            this.$emit('setProjectRate', rate, userId, projectId);
            this.$set(project, 'rate', rate);
        },
    },
}
</script>

<style lang="scss" scoped>
    .rate-value {
        padding-left: 1%;
        height: 36px;
    }
    .project-name {
        cursor: default;
        padding: 5px 0 5px 0;
    }
    .at-collapse {
        color: $gray-2;
        border-radius: 20px;

        &__content .at-collapse__header {
           cursor: pointer;
           padding: 3px 0;
           align-items: center;
        }
    }
    .invoice-input-original {
        display: inline-block;
        width: 100%;
        color: #3F536E;
        font-size: 0.9rem;
        background-color: rgb(213, 213, 255);
        border: 1px solid #C5D9E8;
        border-radius: 4px;
        transition: border .2s;
        outline: none;
        padding: 6.5px 15px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 80px;
        box-sizing: border-box;
        min-width: 80px;
        cursor: text;
        text-align: center;
    }
    .link {
        color: $gray-2;

        &:hover {
            color: $gray-1;
        }
    }

    .text-ellipsis {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    @media screen and (max-width: 991px) {
        .d-xs-none {
            display: none;
        }
    }
</style>
