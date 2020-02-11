<template>
    <div>
        <template v-if="this.section && values">
            <component
                v-for="(component, index) of this.section.topComponents"
                :key="index"
                :is="component"
                :parent="this"
            ></component>
            <validation-observer ref="form">
                <div class="data-entries">
                    <template v-for="(field, key) of this.section.fields">
                        <template
                            v-if="typeof field.displayable !== 'undefined' ? field.displayable : true"
                        >
                            <div :key="key" class="data-entry">
                                <div class="row">
                                    <div class="col-6 label">{{ $t(field.label) }}</div>
                                    <div class="col">
                                        <validation-provider
                                            v-if="typeof field.render !== 'undefined'"
                                            v-slot="{ errors }"
                                        >
                                            <renderable-field
                                                v-model="values[field.key]"
                                                :render="field.render"
                                                :field="field"
                                                :values="values"
                                                class="with-margin"
                                            ></renderable-field>
                                        </validation-provider>

                                        <validation-provider
                                            v-else-if="field.fieldOptions.type === 'input' || field.fieldOptions.type === 'text'"
                                            v-slot="{ errors }"
                                            :name="$t(field.label)"
                                            :vid="field.key"
                                        >
                                            <at-input
                                                v-model="values[field.key]"
                                                :readonly="field.fieldOptions.fckAutocomplete || false"
                                                @focus="removeReadonly"
                                                :placeholder="field.fieldOptions.placeholder || ''"
                                                :type="field.fieldOptions.frontendType || ''"
                                                :status="errors.length > 0  ? 'error' : ''"
                                            ></at-input>
                                            <small>{{ errors[0] }}</small>
                                        </validation-provider>

                                        <validation-provider
                                            v-else-if="field.fieldOptions.type === 'number'"
                                            v-slot="{ errors }"
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

                                        <validation-provider
                                            v-else-if="field.fieldOptions.type === 'select'"
                                            v-slot="{ errors }"
                                            :name="$t(field.label)"
                                            :vid="field.key"
                                        >
                                            <at-select
                                                v-model="values[field.key]"
                                                class="with-margin"
                                            >
                                                <at-option
                                                    v-for="(option, optionKey) of getSelectOptions(field, values)"
                                                    :key="optionKey"
                                                    :value="option.value"
                                                >{{ option.label }}</at-option>
                                            </at-select>
                                            <small>{{ errors[0] }}</small>
                                        </validation-provider>

                                        <validation-provider
                                            v-else-if="field.fieldOptions.type === 'textarea'"
                                            v-slot="{ errors }"
                                            :name="$t(field.label)"
                                            :vid="field.key"
                                        >
                                            <at-textarea
                                                autosize
                                                v-model="values[field.key]"
                                                class="with-margin"
                                                :class="{'at-textarea--error': errors.length > 0}"
                                            ></at-textarea>
                                            <small>{{ errors[0] }}</small>
                                        </validation-provider>

                                        <validation-provider
                                            v-else-if="field.fieldOptions.type === 'listbox'"
                                            v-slot="{ errors }"
                                            :name="$t(field.label)"
                                            :vid="field.key"
                                        >
                                            <ListBox
                                                :keyField="field.fieldOptions.keyField"
                                                :labelField="field.fieldOptions.labelField"
                                                :valueField="field.fieldOptions.valueField"
                                                v-model="values[field.key]"
                                            />
                                            <small>{{ errors[0] }}</small>
                                        </validation-provider>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
                <component
                    v-for="(component, index) of this.section.bottomComponents"
                    :key="index"
                    :is="component"
                    :parent="this"
                ></component>
                <at-button type="primary" @click="submit">{{ $t('control.save') }}</at-button>
            </validation-observer>
        </template>
    </div>
</template>

<script>
    import { cloneDeep } from "lodash";
    import ListBox from "@/components/ListBox";
    import RenderableField from "@/components/RenderableField";
    import Store from "../../store";
    import { ValidationObserver, ValidationProvider } from "vee-validate";

    export default {
        name: "DynamicSettings",

        components: {
            RenderableField,
            ListBox,
            ValidationObserver,
            ValidationProvider
        },

        data() {
            return {
                section: {},
                values: {},
            };
        },

        mounted() {
            this.fetchSectionData();
        },

        watch: {
            sections() {
                this.fetchSectionData();
            }
        },

        computed: {
            sections() {
                return this.$store.getters['settings/sections'];
            }
        },

        methods: {
            fetchSectionData() {
                const name = this.$route.name;
                this.section = this.$store.getters['settings/sections'].filter(s => s.pathName === name)[0];

                if (this.section) {
                    const data = this.section.data;
                    if (data) {
                        Object.keys(data).forEach(key => {
                            this.$set(this.values, key, cloneDeep(data[key]));
                        });
                    }
                }
            },

            removeReadonly(el) {
                if (el.target.getAttribute('readonly') === 'readonly') {
                    el.target.removeAttribute('readonly');
                }
            },

            getSelectOptions(field, values) {
                const { options } = field.fieldOptions;

                if (typeof options === 'function') {
                    return options({ field, values });
                }

                return options;
            },

            submit() {
                this.$store.dispatch('settings/updateSection', {
                    data: this.values,
                    name: this.section.pathName
                });
                this.section.service
                    .save(this.values)
                    .then(data => {
                        this.$Notify({
                            type: 'success',
                            title: 'Information Saved',
                            message: 'Information successfully saved'
                        });
                        this.$router.go(0);
                    })
                    .catch(({ response }) => {
                        console.log(response.data.info, this.$refs.form);
                        this.$refs.form.setErrors(response.data.info);
                    });
            }
        }
    };
</script>

<style lang="scss" scoped>
    .settings__content {
        width: 100%;

        .data-entry {
            margin-bottom: 1em;
        }

        .label {
            font-weight: bold;
        }
    }
</style>
