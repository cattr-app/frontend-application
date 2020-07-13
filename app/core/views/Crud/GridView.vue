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
                <div v-if="visibleFilterFields && visibleFilterFields.length" class="crud__control-items__item">
                    <at-button icon="icon-filter" size="large" @click.prevent.stop="toggleFilterPopup" />

                    <div v-show="filterPopupVisible" class="crud__popup-filters">
                        <template v-for="filter of visibleFilterFields">
                            <div :key="filter.key + '_title'" class="crud__popup-filter-title">
                                {{ $t(filter.label) }}
                            </div>

                            <at-select
                                v-if="filter.fieldOptions && filter.fieldOptions.type === 'select'"
                                :key="filter.key"
                                v-model="filterFieldsModel[filter.key]"
                                type="text"
                                size="small"
                                class="crud__popup-filter"
                                :placeholder="$t(filter.placeholder)"
                                @input="onFilterFieldChange(filter.key, $event)"
                            >
                                <at-option
                                    v-for="(option, optionKey) of filter.fieldOptions.options"
                                    :key="optionKey"
                                    :value="option.value"
                                >
                                    {{ $t(option.label) }}
                                </at-option>
                            </at-select>

                            <UserSelect
                                v-else-if="filter.fieldOptions && filter.fieldOptions.type === 'user-select'"
                                :key="filter.key"
                                v-model="filterFieldsModel[filter.key]"
                                size="small"
                                class="crud__popup-filter"
                                @change="onUserSelectChange(filter.key, $event)"
                            ></UserSelect>

                            <ProjectSelect
                                v-else-if="filter.fieldOptions && filter.fieldOptions.type === 'project-select'"
                                :key="filter.key"
                                v-model="filterFieldsModel[filter.key]"
                                size="small"
                                class="crud__popup-filter"
                                @change="onProjectsChange(filter.key, $event)"
                            />

                            <at-input
                                v-else
                                :key="filter.key"
                                v-model="filterFieldsModel[filter.key]"
                                type="text"
                                size="small"
                                class="crud__popup-filter"
                                :placeholder="$t(filter.placeholder)"
                                @input="onFilterFieldChange(filter.key, $event)"
                            >
                                <template slot="prepend">
                                    <i class="icon icon-search"></i>
                                </template>
                            </at-input>
                        </template>
                    </div>
                </div>

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
            <div ref="tableWrapper" class="crud__table">
                <at-table ref="table" :key="columnsKey" size="large" :columns="columns" :data="displayableData" />
                <preloader v-if="isDataLoading" :is-transparent="true" />
            </div>
        </div>

        <at-pagination
            :total="totalItems"
            :current="page"
            :page-size="itemsPerPage"
            class="crud__pagination"
            @page-change="onPageChange"
        />
    </div>
</template>

<script>
    import Preloader from '@/components/Preloader';
    import ProjectSelect from '@/components/ProjectSelect';
    import UserSelect from '@/components/UserSelect';

    const defaultItemsPerPage = 10;

    export default {
        name: 'GridView',
        components: {
            Preloader,
            ProjectSelect,
            UserSelect,
        },
        data() {
            const { query } = this.$route;
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

            const filterFieldsModel = {};
            const fieldsToLoad = (gridData.filterFields || []).filter(f => f.saveToQuery).map(f => f.key);
            Object.keys(query).forEach(field => {
                if (fieldsToLoad.indexOf(field) !== -1) {
                    filterFieldsModel[field] = query[field];
                }
            });

            return {
                title: gridData.title || '',
                filters: gridData.filters || [],
                filterFields: gridData.filterFields || [],
                tableData: [],

                filterModel: this.$route.query.search,
                filterTimeout: null,
                filterFieldsTimeout: null,
                orderBy,

                filterPopupVisible: false,
                filterFieldsModel: { ...filterFieldsModel },

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
                skipRouteUpdate: false,
            };
        },
        methods: {
            handleSearchInput() {
                clearTimeout(this.filterTimeout);

                this.filterTimeout = setTimeout(() => {
                    this.queryParams.search.query = this.filterModel;
                    const firstPage = 1;
                    this.handlePageChange(firstPage);
                    this.updateRoute();
                }, 500);
            },
            toggleFilterPopup() {
                this.filterPopupVisible = !this.filterPopupVisible;
            },
            showFilterPopup() {
                this.filterPopupVisible = true;
            },
            hideFilterPopup() {
                this.filterPopupVisible = false;
            },
            getFilterFieldKeys() {
                return this.visibleFilterFields.filter(f => f.saveToQuery).map(f => f.key);
            },
            getFilterFields() {
                const filters = {};
                const fieldsToSave = this.getFilterFieldKeys();
                Object.keys(this.filterFieldsModel).forEach(field => {
                    if (fieldsToSave.indexOf(field) !== -1 && typeof this.filterFieldsModel[field] !== undefined) {
                        filters[field] = this.filterFieldsModel[field];
                    }
                });

                return filters;
            },
            loadFilterFields() {
                const { query } = this.$route;
                const filters = {};
                const fieldsToLoad = this.getFilterFieldKeys();
                Object.keys(query).forEach(field => {
                    if (fieldsToLoad.indexOf(field) !== -1) {
                        filters[field] = query[field];
                    }
                });

                this.filterFieldsModel = filters;
            },
            updateQueryParams() {
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
            },
            filterFieldsData() {
                clearTimeout(this.filterFieldsTimeout);

                this.filterFieldsTimeout = setTimeout(() => {
                    this.updateQueryParams();
                    const firstPage = 1;
                    this.handlePageChange(firstPage);
                }, 500);
            },
            onFilterFieldChange(key, data) {
                this.filterFieldsData();
                this.updateRoute();
            },
            onUserSelectChange(key, data) {
                if (data.length > 0) {
                    this.filterFieldsModel[key] = ['=', data];
                } else {
                    this.filterFieldsModel[key] = '';
                }

                this.filterFieldsData();
            },
            onProjectsChange(key, data) {
                if (data.length > 0) {
                    this.filterFieldsModel[key] = ['=', data];
                } else {
                    this.filterFieldsModel[key] = '';
                }

                this.filterFieldsData();
            },
            checkWithCtx(callback) {
                return callback ? callback(this) : true;
            },
            handleWithCtx(callback) {
                callback(this);
            },
            async onPageChange(page) {
                await this.handlePageChange(page);
                this.updateRoute();
            },
            handlePageChange(page) {
                if (this.queryParams.page === page) {
                    return;
                }

                this.queryParams.page = page;
                return this.fetchData();
            },
            async fetchData() {
                this.isDataLoading = true;

                const { queryParams, sortable, orderBy } = this;
                if (sortable && orderBy) {
                    queryParams['orderBy'] = [orderBy.key, orderBy.direction];
                }

                try {
                    const res = await this.service.getWithFilters(queryParams);
                    const { data, total, current_page } = res.data;

                    this.totalItems = total;
                    this.page = current_page;

                    this.tableData = data;
                } catch ({ response }) {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn(response ? response : 'request is canceled');
                    }
                }

                this.isDataLoading = false;
            },
            handleClick(e) {
                if (e.target.closest('.crud__popup-filters')) {
                    return;
                }

                if (this.filterPopupVisible) {
                    this.hideFilterPopup();
                }
            },
            handleResize() {
                const { table } = this.$refs;
                if (!table) {
                    return;
                }

                table.handleResize();
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
                if (this.skipRouteUpdate) {
                    return;
                }

                const data = {
                    name: this.$route.name,
                    query: {
                        page: this.queryParams.page,
                        search: this.queryParams.search.query,
                        ...this.getFilterFields(),
                    },
                };

                this.$router.push(data);
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
            columnsKey() {
                // Used to forced update table when columns changed
                return this.columns.map(col => col.title).join(',');
            },
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

                return columns.filter(column => this.checkWithCtx(column.renderCondition));
            },
            visibleFilterFields() {
                return this.filterFields.filter(filter => {
                    const column = this.columns.find(column => column.key === filter.key);
                    if (column) {
                        return this.checkWithCtx(column.renderCondition);
                    }

                    return true;
                });
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
            this.loadFilterFields();
            this.updateQueryParams();
            await this.fetchData();

            window.addEventListener('click', this.handleClick);
            window.addEventListener('resize', this.handleResize);
            this.handleResize();

            if (this.$refs.tableWrapper) {
                this.$refs.tableWrapper.addEventListener('click', this.handleTableClick);
            }
        },
        watch: {
            async $route(to) {
                this.skipRouteUpdate = true;

                this.queryParams.page = to.query.page;
                this.queryParams.search.query = to.query.search;
                this.filterModel = to.query.search;
                this.loadFilterFields();
                this.updateQueryParams();
                await this.fetchData();

                this.skipRouteUpdate = false;
            },
        },
        beforeDestory() {
            window.removeEventListener('click', this.handleClick);
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
                position: relative;
                margin-right: 1rem;
            }
        }

        &__popup-filters {
            position: absolute;
            top: calc(100% + #{$spacing-03});
            right: 0;

            background: #fff;
            border: 1px solid $gray-5;
            border-radius: 5px;
            box-shadow: 0px 0px 100px rgba(63, 51, 86, 0.05);

            display: block;

            min-width: 200px;

            padding: $spacing-03;

            z-index: 1;
        }

        &__popup-filter-title {
            font-weight: 600;
        }

        &__popup-filter {
            &:not(:last-child) {
                margin-bottom: $spacing-03;
            }

            &::v-deep .at-select__placeholder {
                color: #3f536e;
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
