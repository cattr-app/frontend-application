<template>
    <div class="container crud">
        <div class="row flex-around">
            <div class="col-24 col-lg-20">
                <div class="at-container crud__content crud__item-view">
                    <div class="page-controls">
                        <h1 class="control-item title">
                            <Skeleton :loading="isDataLoading" width="200px">{{ title }}</Skeleton>
                        </h1>

                        <div class="control-items">
                            <at-button size="large" @click="$router.go(-1)" class="control-item">{{ $t('control.back') }}
                            </at-button>
                            <template v-if="pageData.pageControls && pageData.pageControls.length > 0">
                                <template v-for="(button, key) of pageData.pageControls">
                                    <at-button
                                            class="control-item"
                                            :key="key"
                                            size="large"
                                            :type="button.renderType || ''"
                                            :icon="button.icon || ''"
                                            @click="handleClick(button)"
                                            v-if="checkRenderCondition(button)"
                                    >{{ $t(button.label) }}
                                    </at-button>
                                </template>
                            </template>
                        </div>
                    </div>
                    <component v-for="(component, index) of pageData.topComponents" :key="index"
                               :is="component" :parent="this"></component>
                    <div class="data-entries">
                        <div class="data-entry" v-for="(field, key) of fields" v-bind:key="key">
                            <div class="row">
                                <div class="col-6 label">
                                    {{ $t(field.label) }}:
                                </div>
                                <div class="col">
                                    <Skeleton :loading="isDataLoading">
                                        <renderable-field
                                                v-if="typeof field.render !== 'undefined' && Object.keys(values).length > 0"
                                                :render="field.render"
                                                :value="values[field.key]"
                                                :field="field"
                                        ></renderable-field>
                                        <template v-else>{{ values[field.key] }}</template>
                                    </Skeleton>
                                </div>
                            </div>
                        </div>
                    </div>
                    <component v-for="(component, index) of pageData.bottomComponents" v-bind:key="index"
                               v-bind:is="component" :parent="this"></component>
                </div>
            </div>
            <!-- /.col-24 -->
        </div>
        <!-- /.row -->
    </div>
</template>

<script>
    import RenderableField from '../../components/RenderableField';
    import { Skeleton } from 'vue-loading-skeleton';

    export default {
        name: 'ItemView',

        components: {
            RenderableField,
            Skeleton
        },

        computed: {
            title() {
                const {fields, values, service, filters, pageData} = this;
                const {titleCallback} = this.$route.meta;
                if (typeof titleCallback === 'function') {
                    return titleCallback({fields, values, service, filters, pageData});
                }

                return this.$t(pageData.title);
            },
        },

        data() {
            const { fields, service, filters, pageData } = this.$route.meta;

            return {
                fields: fields || [],
                values: {},
                service,
                filters,

                pageData: {
                    title: pageData.title || null,
                    topComponents: pageData.topComponents || [],
                    bottomComponents: pageData.bottomComponents || [],
                    pageControls: pageData.pageControls || []
                },

                isDataLoading: false
            };
        },

        async mounted() {
            const id = this.$route.params[this.service.getIdParam()];

            this.isDataLoading = true;

            await this.service.getItem(id, this.filters).then(({ data }) => {
                this.isDataLoading = false;
                this.values = data;
            }).catch(({ response }) => {
                if (response.data.error_type === 'query.item_not_found') {
                    this.$router.push({ name: 'forbidden' });
                }
            });
        },

        methods: {
            handleClick(button) {
                button.onClick(this, this.values[this.service.getIdParam()]);
            },

            checkRenderCondition(button) {
                return typeof button.renderCondition !== 'undefined' ? button.renderCondition(this) : true;
            }
        }
    };
</script>

<style lang="scss" scoped>
    .crud {
        &__item-view {
            .page-controls {
                margin-bottom: 1.5em;
                display: flex;
                justify-content: space-between;

                .control-item {
                    margin-right: .5em;

                    &:last-child {
                        margin-right: 0;
                    }
                }

                .title {
                    margin-right: 1.5em;
                    font-size: 1.6rem;
                }
            }

            .data-entries {
                .data-entry {
                    padding-bottom: 1em;
                    margin-bottom: 1em;
                    border-bottom: 1px solid $gray-6;

                    &:last-child {
                        border-bottom: none;
                    }

                    .label {
                        margin-right: 1em;
                        font-weight: bold;
                    }
                }
            }
        }
    }
</style>
