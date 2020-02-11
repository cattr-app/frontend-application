<template>
    <div class="crud">
        <div class="crud__header">
            <h1 class="page-title crud__title">{{ $t(title) }}</h1>
            <h4 class="crud__total">{{ $t('field.total') }} {{ totalItems }}</h4>
        </div>

        <div class="row crud__filters">
            <at-input v-for="(filter, key) of filters" :key="key" v-model="filterModel[filter.referenceKey]"
                      type="text"
                      @input="filterData(filter.referenceKey, filterModel[filter.referenceKey])"
                      :placeholder="$t(filter.filterName)"
                      class="col-6 crud__filter"
            >
                <template slot="prepend">
                    <i class="icon icon-search"></i>
                </template>
            </at-input>

            <div class="col crud__control-items">
                <template v-for="(control, key) of pageControls">
                    <template v-if="checkWithCtx(control.renderCondition)">
                        <at-button
                                :key="key"
                                size="large"
                                :type="control.type"
                                :icon="control.icon"
                                @click="handleWithCtx(control.onClick)"
                        >{{ $t(control.label) }}
                        </at-button>
                    </template>
                </template>
            </div>
        </div>

        <div class="at-container">
                <div class="crud__table">
                    <at-table size="large"
                              :columns="columns"
                              :data="displayableData">
                    </at-table>

                    <preloader v-if="isDataLoading"></preloader>
                </div>
        </div>

        <at-pagination :total="totalItems"
                       :current="page"
                       @page-change="loadPage"
                       class="crud__pagination">
        </at-pagination>
    </div>
</template>

<script>
    import Preloader from '@/components/Preloader';
    import axios from 'axios';

    const CancelToken = axios.CancelToken;
    let cancel;

    export default {
        name: 'GridView',

        components: {
            Preloader
        },

        data() {
            const { gridData } = this.$route.meta;

            const columns = gridData.columns.map(col => {
                col.title = this.$t(col.title);
                return col;
            });

            if (gridData.actions.length > 0 && columns.filter(t => t.title === 'field.actions').length === 0) {
                columns.push({
                    title: this.$t('field.actions'),
                    render: (h, params) => {
                        return h(
                            'div',
                            {
                                class: 'actions-column'
                            },
                            gridData.actions.map((item) => {
                                if (typeof item.renderCondition !== 'undefined' ? item.renderCondition(this) : true) {
                                    return h('AtButton', {
                                        props: {
                                            type: item.actionType || 'primary', // AT-ui button display type
                                            icon: item.icon || undefined // Prepend icon to button
                                        },
                                        on: {
                                            click: () => {
                                                item.onClick(this.$router, params, this);
                                            }
                                        },
                                        class: 'action-button'
                                    }, this.$t(item.title));
                                }
                            })
                        );
                    }
                });
            }

            const itemsPerPage = 10;
            const withParam = gridData.with;
            const withCount = gridData.withCount;

            return {
                title: gridData.title || '',
                columns,
                filters: gridData.filters || [],
                tableData: [],
                initialData: [],

                filterModel: {},
                filterTimeout: null,

                service: gridData.service,

                pageControls: this.$route.meta.pageControls || [],

                page: +(this.$route.query.page || 1),
                totalItems: 0,

                queryParams: {
                    with: withParam,
                    withCount,
                    paginate: true,
                    perPage: itemsPerPage,
                    page: this.$route.query.page,
                },

                isDataLoading: false
            };
        },

        methods: {
            filterData(field, searchString) {
                clearTimeout(this.filterTimeout);

                this.filterTimeout = setTimeout(() => {
                    // This is the way api Apply Query for Where Like condition ;  '%' - is important
                    // TODO Refactor when TypeScript will be here
                    this.queryParams[field] = ['like', '%' + searchString + '%'];

                    const firstPage = 1;
                    this.loadPage(firstPage);
                }, 500);
            },

            checkWithCtx(callback) {
                return callback ? callback(this) : true;
            },

            handleWithCtx(callback) {
                callback(this);
            },

            async loadPage(page) {
                history.pushState({}, null, `?page=${page}`);
                this.queryParams.page = page;
                await this.fetchData();
            },

            async fetchData() {
                this.isDataLoading = true;

                if (cancel !== undefined) {
                    cancel();
                }

                const config = {
                    cancelToken: new CancelToken(function executor(c) {
                        cancel = c;
                    })
                };

                let { data, total, current_page } = (await this.service.getWithFilters(this.queryParams, config)
                    .then(({ data }) => {
                        this.isDataLoading = false;
                        return data;
                    }));

                this.totalItems = total;
                this.page = current_page;

                this.tableData = data;
                this.initialData = data;
            }
        },

        computed: {
            displayableData() {
                return this.tableData;
            }
        },

        async beforeRouteUpdate(from, to, next) {
            this.fetchData();
            next();
        },

        async mounted() {
            if (!this.initialData.length) {
                await this.fetchData();
            }
        }
    };
</script>

<style lang="scss" scoped>
    .crud {
        &__header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            margin-bottom: $layout-01;
        }

        &__total {
            color: $gray-2;
        }

        &__control-items {
            text-align: right;
        }

        &__pagination {
            display: flex;
            justify-content: flex-end;

            margin-left: auto;
        }

        &__filters {
            margin-bottom: $spacing-03;
        }

        &__filter {
            &::v-deep {
                .at-input-group__prepend {
                    border: 1px solid $gray-5;
                    border-right: 0;
                }

                .at-input__original {
                    border: 1px solid $gray-5;
                }
            }
        }

        &__table {
            position: relative;

            &::v-deep tr {
                th {
                    background: #fff;
                    color: #C4C4CF;
                }
            }

            &::v-deep .at-table {
                &__content {
                 border: 0;
                }

                &__tbody {
                    tr:last-child .at-table__cell {
                    border-bottom: 0;
                    }
                }

                &__cell {
                    max-width: 250px;
                    overflow: hidden;

                    padding-top: $spacing-05;
                    padding-bottom: $spacing-05;
                    border-bottom: 2px solid $blue-3;

                    &:last-child {
                        max-width: unset;
                    }
                }

                .actions-column {
                    display: flex;
                    flex-flow: row nowrap;
                }

                .action-button {
                    margin-right: 1em;
                }
            }
        }
    }

    .at-container {
        margin-bottom: $layout-01;
        overflow: hidden;
    }
</style>
