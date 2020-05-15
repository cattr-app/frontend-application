<template>
    <div class="crud" :class="crudClass">
        <div class="crud__header">
            <h1 class="page-title crud__title">{{ $t(title) }}</h1>
            <h4 class="crud__total">{{ $t('field.total') }} {{ totalItems }}</h4>
        </div>

        <div class="row crud__filters">
            <at-input
                v-if="filters.length"
                v-model="filterModel"
                type="text"
                :placeholder="filterPlaceholder"
                class="col-6 crud__filter"
                @input="handleSearchInput"
            >
                <template slot="prepend">
                    <i class="icon icon-search"></i>
                </template>
            </at-input>

            <div class="col crud__control-items">
                <template v-for="(control, key) of pageControls">
                    <template v-if="checkWithCtx(control.renderCondition)">
                        <at-checkbox
                            v-if="control.frontedType == 'checkbox'"
                            :key="control.key"
                            v-model="values[control.key]"
                            class="crud__control-items__item"
                            @on-change="handleWithCtx(control.onChange)"
                        >
                            {{ $t(control.label) }}
                        </at-checkbox>

                        <at-button
                            v-else
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
            <div v-if="filterFields && filterFields.length" class="crud__column-filters">
                <template v-for="filter of filterFields">
                    <at-select
                        v-if="filter.fieldOptions && filter.fieldOptions.type === 'select'"
                        :key="filter.key"
                        v-model="filterFieldsModel[filter.key]"
                        type="text"
                        :placeholder="$t(filter.placeholder)"
                        class="crud__column-filter"
                        :style="{ width: columnWidth[filter.key] + 'px' }"
                        @input="filterFieldsData"
                    >
                        <at-option
                            v-for="(option, optionKey) of filter.fieldOptions.options"
                            :key="optionKey"
                            :value="option.value"
                        >
                            {{ $t(option.label) }}
                        </at-option>
                    </at-select>

                    <at-input
                        v-else
                        :key="filter.key"
                        v-model="filterFieldsModel[filter.key]"
                        type="text"
                        :placeholder="$t(filter.placeholder)"
                        class="crud__column-filter"
                        :style="{ width: columnWidth[filter.key] + 'px' }"
                        @input="filterFieldsData"
                    >
                        <template slot="prepend">
                            <i class="icon icon-search"></i>
                        </template>
                    </at-input>
                </template>
            </div>

            <div ref="tableWrapper" class="crud__table">
                <at-table ref="table" size="large" :columns="columns" :data="displayableData" />
                <preloader v-if="isDataLoading" :is-transparent="true" />
            </div>
        </div>

        <at-pagination
            :total="totalItems"
            :current="page"
            :page-size="itemsPerPage"
            class="crud__pagination"
            @page-change="handlePageChange"
        />
    </div>
</template>

<script>
    import Preloader from '@/components/Preloader';

    const defaultItemsPerPage = 10;

    export default {
        name: 'GridView',
        components: {
            Preloader,
        },
        data() {
            const { gridData, sortable } = this.$route.meta;

            let orderBy = null;
            if (sortable && gridData.columns.length) {
                const col = gridData.columns[0];

                orderBy = {
                    ...col,
                    title: this.$t(col.title),
                    direction: 'asc',
                };
            }

            const withParam = gridData.with;
            const withCount = gridData.withCount;

            return {
                title: gridData.title || '',
                filters: gridData.filters || [],
                filterFields: gridData.filterFields || [],
                tableData: [],

                filterModel: this.$route.query.search,
                filterTimeout: null,
                filterFieldsTimeout: null,
                orderBy,

                filterFieldsModel: {},
                columnWidth: {},

                service: gridData.service,

                pageControls: this.$route.meta.pageControls || [],

                page: +(this.$route.query.page || 1),
                totalItems: 0,
                values: [],
                queryParams: {
                    with: withParam,
                    withCount,
                    paginate: true,
                    perPage: this.$route.meta.itemsPerPage || defaultItemsPerPage,
                    page: this.$route.query.page,
                    search: {
                        query: this.$route.query.search,
                        fields: gridData.filters.map(filter => filter.referenceKey),
                    },
                },

                isDataLoading: false,
            };
        },
        methods: {
            handleSearchInput() {
                clearTimeout(this.filterTimeout);

                this.filterTimeout = setTimeout(() => {
                    this.queryParams.search.query = this.filterModel;
                    const firstPage = 1;
                    this.handlePageChange(firstPage);
                }, 500);
            },
            filterFieldsData() {
                clearTimeout(this.filterFieldsTimeout);

                this.filterFieldsTimeout = setTimeout(() => {
                    Object.keys(this.filterFieldsModel).forEach(field => {
                        if (
                            typeof this.filterFieldsModel[field] !== undefined &&
                            this.filterFieldsModel[field].toString().length
                        ) {
                            const filter = this.filterFields.find(filter => filter.key === field);
                            if (filter && filter.fieldOptions && filter.fieldOptions.type === 'text') {
                                this.queryParams[field] = ['like', `%${this.filterFieldsModel[field]}%`];
                            } else {
                                this.queryParams[field] = this.filterFieldsModel[field];
                            }
                        } else {
                            delete this.queryParams[field];
                        }
                    });

                    const firstPage = 1;
                    this.handlePageChange(firstPage);
                }, 500);
            },
            checkWithCtx(callback) {
                return callback ? callback(this) : true;
            },
            handleWithCtx(callback) {
                callback(this);
            },
            async handlePageChange(page) {
                this.queryParams.page = page;
                await this.fetchData();
            },
            async fetchData() {
                this.isDataLoading = true;

                const { queryParams, sortable, orderBy } = this;
                if (sortable && orderBy) {
                    queryParams['orderBy'] = [orderBy.key, orderBy.direction];
                }

                try {
                    const response = await this.service.getWithFilters(queryParams);
                    const { data, total, current_page } = response.data;

                    this.totalItems = total;
                    this.page = current_page;

                    this.tableData = data;
                } catch (e) {
                    // Ignore exception
                }

                this.isDataLoading = false;
            },
            handleResize() {
                const { table } = this.$refs;
                if (!table) {
                    return;
                }

                table.handleResize();

                this.$nextTick(() => {
                    table.columnsData.forEach((column, index) => {
                        const width = table.setCellWidth(column, index);
                        this.$set(this.columnWidth, column.key, width);
                    });
                });
            },
            handleTableClick(e) {
                const { sortable, orderBy } = this;
                if (!sortable) {
                    return;
                }

                if (
                    !e.target.classList.contains('at-table__cell') ||
                    !e.target.classList.contains('at-table__column')
                ) {
                    return;
                }

                let column = null;
                for (let _column of this.columns) {
                    if (_column.title === e.target.textContent.trim()) {
                        column = _column;
                        break;
                    }
                }

                if (!column || !column.key) {
                    return;
                }

                if (orderBy && orderBy.key === column.key) {
                    const direction = orderBy.direction === 'asc' ? 'desc' : 'asc';
                    this.orderBy = { ...orderBy, direction };
                } else {
                    this.orderBy = { ...column, direction: 'asc' };
                }

                this.fetchData();
            },
            onView({ id }) {
                this.$router.push({ name: this.$route.meta.navigation.view, params: { id } });
            },
            onEdit({ id }) {
                this.$router.push({ name: this.$route.meta.navigation.edit, params: { id } });
            },
            async onDelete({ id }) {
                const isConfirm = await this.$CustomModal({
                    title: this.$t('notification.record.delete.confirmation.title'),
                    content: this.$t('notification.record.delete.confirmation.message'),
                    okText: this.$t('control.delete'),
                    cancelText: this.$t('control.cancel'),
                    showClose: false,
                    styles: {
                        'border-radius': '10px',
                        'text-align': 'center',
                        footer: {
                            'text-align': 'center',
                        },
                        header: {
                            padding: '16px 35px 4px 35px',
                            color: 'red',
                        },
                        body: {
                            padding: '16px 35px 4px 35px',
                        },
                    },
                    width: 320,
                    type: 'trash',
                    typeButton: 'error',
                });

                if (isConfirm !== 'confirm') {
                    return;
                }

                await this.service.deleteItem(id);
                this.$Notify({
                    type: 'success',
                    title: this.$t('notification.record.delete.success.title'),
                    message: this.$t('notification.record.delete.success.message'),
                });

                await this.fetchData();
            },
            updateRoute() {
                this.$router.push({
                    name: this.$route.name,
                    query: { page: this.queryParams.page, search: this.queryParams.search.query },
                });
            },
        },
        updated() {
            const { sortable, orderBy } = this;
            if (!sortable || !orderBy) {
                return;
            }

            const { tableWrapper } = this.$refs;

            if (tableWrapper === undefined) {
                return;
            }

            const chevrons = tableWrapper.querySelectorAll('.at-table__cell.at-table__column > .chevron');
            chevrons.forEach(chevron => chevron.remove());

            let column = null;
            const columns = tableWrapper.querySelectorAll('.at-table__cell.at-table__column');
            for (let _column of columns) {
                if (_column.textContent.trim() === orderBy.title) {
                    column = _column;
                    break;
                }
            }

            if (!column) {
                return;
            }

            if (orderBy.direction === 'asc') {
                column.insertAdjacentHTML('beforeend', '<i class="icon icon-chevron-up chevron"></i>');
            } else {
                column.insertAdjacentHTML('beforeend', '<i class="icon icon-chevron-down chevron"></i>');
            }
        },
        computed: {
            columns() {
                const { gridData, sortable } = this.$route.meta;

                const columns = gridData.columns.map(col => ({ ...col, title: this.$t(col.title) }));

                if (gridData.actions.length > 0 && columns.filter(t => t.title === 'field.actions').length === 0) {
                    columns.push({
                        title: this.$t('field.actions'),
                        render: (h, params) => {
                            return h(
                                'div',
                                {
                                    class: 'actions-column',
                                },
                                gridData.actions.map(item => {
                                    if (
                                        typeof item.renderCondition !== 'undefined'
                                            ? item.renderCondition(this, params.item)
                                            : true
                                    ) {
                                        return h(
                                            'AtButton',
                                            {
                                                props: {
                                                    type: item.actionType || 'primary', // AT-ui button display type
                                                    icon: item.icon || undefined, // Prepend icon to button
                                                },
                                                on: {
                                                    click: () => {
                                                        item.onClick(this.$router, params, this);
                                                    },
                                                },
                                                class: 'action-button',
                                            },
                                            this.$t(item.title),
                                        );
                                    }
                                }),
                            );
                        },
                    });
                }

                return columns;
            },
            displayableData() {
                return this.tableData;
            },
            filterPlaceholder() {
                const filters = [...this.filters];
                const last = filters.pop();
                if (filters.length) {
                    const fields = filters.map(filter => this.$t(filter.filterName)).join(', ');
                    return this.$t('filter.enter-multiple', [fields, this.$t(last.filterName)]);
                } else {
                    return this.$t('filter.enter-single', [this.$t(last.filterName)]);
                }
            },
            itemsPerPage() {
                return this.$route.meta.itemsPerPage || defaultItemsPerPage;
            },
            crudClass() {
                const styles = {};
                if (typeof this.$route.meta.style !== 'undefined') {
                    styles[`crud_style_${this.$route.meta.style}`] = true;
                }

                if (this.sortable) {
                    styles['crud_sortable'] = true;
                }

                return styles;
            },
            sortable() {
                return !!this.$route.meta.sortable;
            },
        },
        async mounted() {
            await this.fetchData();

            window.addEventListener('resize', this.handleResize);
            this.handleResize();

            this.$refs.tableWrapper.addEventListener('click', this.handleTableClick);
        },
        watch: {
            $route(to) {
                this.queryParams.page = to.query.page;
                this.queryParams.search.query = to.query.search;
                this.filterModel = to.query.search;
                this.fetchData();
            },
            queryParams: {
                handler() {
                    this.updateRoute();
                },
                deep: true,
            },
        },
        beforeDestory() {
            window.removeEventListener('resize', this.handleResize);

            this.$refs.tableWrapper.removeEventListener('click', this.handleTableClick);
        },
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
            display: flex;
            justify-content: flex-end;
            align-items: center;
            &__item {
                padding-right: 1rem;
            }
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

        &__column-filters {
            display: flex;
            flex-flow: row nowrap;

            z-index: 1;
        }

        &__column-filter {
            padding: 0.5rem;

            &::v-deep {
                .at-input-group__prepend {
                    border: 1px solid $gray-5;
                    border-right: 0;
                }

                .at-input__original,
                .at-select__selection {
                    border: 1px solid $gray-5;
                }
            }
        }

        &__table {
            position: relative;

            &::v-deep tr {
                th {
                    background: #fff;
                    color: #c4c4cf;
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

        &_style_compact {
            &::v-deep .at-table__cell {
                padding-top: 0.5rem;
                padding-bottom: 0.5rem;
            }
        }

        &_sortable {
            &::v-deep .at-table__cell.at-table__column {
                cursor: pointer !important;
            }
        }
    }

    .at-container {
        margin-bottom: $layout-01;
        overflow: hidden;
    }
</style>
