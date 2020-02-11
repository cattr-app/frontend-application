<template>
    <div class="container crud">
        <div class="at-container crud__content crud__edit-view">
            <div class="page-controls">
                <h1 class="control-item title">
                    {{ $route.params.id ? `${$t(pageData.title)} #${$route.params.id}` : `${$t(pageData.title)}` }}
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
                            >
                                {{ $t(button.label) }}
                            </at-button>
                        </template>
                    </template>
                </div>
            </div>

            <component v-for="(component, index) of pageData.topComponents"
                       :key="index"
                       :is="component"
                       :parent="this"
            ></component>
            <validation-observer ref="form">
                <div class="data-entries">
                    <template v-for="(field, key) of fields">
                        <template v-if="typeof field.displayable !== 'undefined' ? field.displayable : true">
                            <div :key="key" class="data-entry">
                                <div class="row">
                                    <div class="col-6">
                                        <p class="label">{{ $t(field.label) }}<span v-if="field.required">*</span></p>
                                    </div>
                                    <at-input class="col-18" v-if="isDataLoading && pageData.type === 'edit'" disabled></at-input>
                                    <div v-else class="col-18">
                                        <validation-provider v-if="typeof field.render !== 'undefined'"
                                                             v-slot="{ errors }"
                                                             :rules="typeof field.rules === 'string'
                                                                ? field.rules
                                                                : field.required
                                                                    ? 'required'
                                                                    : ''"
                                                             :name="$t(field.label)"
                                                             :vid="field.key"
                                        >
                                            <renderable-field v-model="values[field.key]"
                                                              :render="field.render"
                                                              :field="field"
                                                              :values="values"
                                                              :setValue="setValue"
                                                              :class="{'at-select--error at-input--error has-error': errors.length > 0}"
                                            ></renderable-field>
                                            <small>{{ errors[0] }}</small>
                                        </validation-provider>

                                        <validation-provider v-else-if="field.type === 'input' || field.type === 'text'"
                                                             v-slot="{ errors }"
                                                             :rules="field.required ? 'required' : ''"
                                                             :name="$t(field.label)"
                                                             :vid="field.key"
                                        >
                                            <at-input v-model="values[field.key]"
                                                      :placeholder="fields.placeholder || ''"
                                                      :type="field.frontendType || ''"
                                                      :status="errors.length > 0  ? 'error' : ''"
                                            ></at-input>
                                            <small>{{ errors[0] }}</small>
                                        </validation-provider>

                                        <validation-provider v-else-if="field.type === 'number'"
                                                             v-slot="{ errors }"
                                                             :rules="field.required ? 'required' : ''"
                                                             :name="$t(field.label)"
                                                             :vid="field.key"
                                        >
                                            <at-input-number
                                                    :min="field.minValue"
                                                    :max="field.maxValue"
                                                    v-model="values[field.key]"
                                            ></at-input-number>
                                            <small>{{ errors[0] }}</small>
                                        </validation-provider>

                                        <validation-provider v-else-if="field.type === 'select'"
                                                             v-slot="{ errors }"
                                                             :rules="field.required ? 'required' : ''"
                                                             :name="$t(field.label)"
                                                             :vid="field.key"
                                        >
                                            <at-select v-model="values[field.key]"
                                                       :class="{'at-select--error': errors.length > 0}"
                                                       :placeholder="$t('control.select')"
                                            >
                                                <at-option v-for="(option, optionKey) of field.options"
                                                           :key="optionKey"
                                                           :value="option.value"
                                                >{{ $t(option.label) }}
                                                </at-option>
                                            </at-select>
                                            <small>{{ errors[0] }}</small>
                                        </validation-provider>

                                        <validation-provider v-else-if="field.type === 'checkbox'"
                                                             v-slot="{ errors }"
                                                             :rules="field.required ? 'required' : ''"
                                                             :name="$t(field.label)"
                                                             :vid="field.key"
                                        >
                                            <at-checkbox v-model="values[field.key]" label="" />
                                            <small>{{ errors[0] }}</small>
                                        </validation-provider>

                                        <validation-provider v-else-if="field.type === 'resource-select'"
                                                             v-slot="{ errors }"
                                                             :rules="field.required ? 'required' : ''"
                                                             :name="$t(field.label)"
                                                             :vid="field.key"
                                        >
                                            <resource-select v-model="values[field.key]"
                                                             :service="field.service"
                                                             :class="{'at-select--error': errors.length > 0}"
                                            ></resource-select>
                                            <small>{{ errors[0] }}</small>
                                        </validation-provider>

                                        <validation-provider v-else-if="field.type === 'textarea'"
                                                             v-slot="{ errors }"
                                                             :rules="field.required ? 'required' : ''"
                                                             :name="$t(field.label)"
                                                             :vid="field.key"
                                        >
                                            <at-textarea autosize
                                                         min-rows="2"
                                                         v-model="values[field.key]"
                                                         :class="{'at-textarea--error': errors.length > 0}"
                                            ></at-textarea>
                                            <small>{{ errors[0] }}</small>
                                        </validation-provider>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
                <component v-for="(component, index) of pageData.bottomComponents"
                           :key="index"
                           :is="component"
                           :parent="this"
                ></component>
                <at-button type="primary" @click="submit" :disabled="isSubmitBtnDisabled">{{ $t('control.save') }}</at-button>
            </validation-observer>
        </div>
    </div>
</template>

<script>
    import RenderableField from '../../components/RenderableField';
    import ResourceSelect from '../../components/ResourceSelect';
    import { ValidationObserver, ValidationProvider } from 'vee-validate';

    export default {
        name: 'EditView',
        components: {
            RenderableField,
            ResourceSelect,
            ValidationProvider,
            ValidationObserver
        },

        data() {
            const meta = this.$route.meta;
            const pageData = meta.pageData || {};

            return {
                service: meta.service,
                fields: meta.fields || [],
                values: {},
                filters: this.$route.meta.filters,

                pageData: {
                    title: pageData.title,
                    topComponents: pageData.topComponents || [],
                    bottomComponents: pageData.bottomComponents || [],
                    type: pageData.type || 'new',
                    routeNamedSection: pageData.editRouteName || '',
                    pageControls: this.$route.meta.pageData.pageControls || [],
                    editRouteName: pageData.editRouteName || ''
                },

                isSubmitBtnDisabled: false,
                isDataLoading: false,
                afterSubmitCallback: meta.afterSubmitCallback,
            };
        },

        async mounted() {
            if (!Object.values(this.values).length) {
                await this.fetchData();
            }
        },

        async beforeRouteEnter(to, from, next) {
            next(async vm => {
                await vm.fetchData();
                next();
            })
        },

        async beforeRouteUpdate(to, from, next) {
            await this.fetchData();
            next();
        },

        methods: {
            async fetchData() {
                this.isDataLoading = true;

                if (this.pageData.type === 'edit') {
                    const data = await this.service.getItem(this.$route.params[this.service.getIdParam()], this.filters)
                        .then(({ data }) => {
                            this.isDataLoading = false;
                            return data;
                        }).catch(({ response }) => {
                            if (response.data.error_type === 'query.item_not_found') {
                                this.$router.push({ name: 'forbidden' });
                            }
                        });

                    Object.keys(data).forEach(key => {
                        this.$set(this.values, key, data[key]);
                    });
                }
            },

            async submit() {
                const valid = await this.$refs.form.validate();
                if (!valid) {
                    return;
                }

                this.isSubmitBtnDisabled = true;

                this.service.save(this.values, this.pageData.type === 'new').then(({data}) => {
                    this.$Notify({
                        type: 'success',
                        title: 'Information Saved',
                        message: 'View saved successfully'
                    });

                    this.isSubmitBtnDisabled = false;

                    if (this.afterSubmitCallback) {
                        this.afterSubmitCallback();
                    } else if (this.pageData.type === 'new') {
                        this.$router.push({
                            name: this.pageData.editRouteName,
                            params: {id: data.res[this.service.getIdParam()]}
                        });
                    }
                }, ({ response }) => {
                    this.isSubmitBtnDisabled = false;
                    this.$refs.form.setErrors(response.data.info);
                })
            },

            handleClick(button) {
                button.onClick(this, this.values[this.service.getIdParam()]);
            },

            checkRenderCondition(button) {
                return typeof button.renderCondition !== 'undefined' ? button.renderCondition(this) : true;
            },

            setValue(key, value) {
                this.$set(this.values, key, value);
            },
        }
    };
</script>

<style lang="scss" scoped>
    .crud {

        &__edit-view {
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
                    margin-bottom: 1em;

                    .label {
                        font-weight: bold;
                    }
                }
            }
        }
    }
</style>
