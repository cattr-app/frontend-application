<template>
    <div class="content-wrapper">
        <div class="container">
            <div class="at-container crud__content">
                <div class="wrap-steps">
                    <at-steps ref="steps" :current="currentStep" class="wrap-steps__steps" :status="stepsStatus">
                        <at-step
                            v-for="(component, index) in components"
                            :key="index"
                            :status="stateOfComponents[component.name].status"
                            :title="$t('reset.step', { n: ++index })"
                            :description="$t(`setup.step_description.${component.name}`)"
                        />
                    </at-steps>
                </div>

                <div class="col form-wrap">
                    <div class="form-wrap__header">
                        <div class="header-text">
                            <h2 class="header-text__title">
                                {{ $t(`setup.header.${this.stepName}.title`) }}
                            </h2>
                            <p class="header-text__subtitle">
                                {{ $t(`setup.header.${this.stepName}.subtitle`) }}
                            </p>
                        </div>
                    </div>
                    <div class="form-wrap__component">
                        <component
                            :is="currentComponent"
                            :storage="stateOfComponents"
                            @setState="getStateOfCurrentComponent"
                            @getStatusOfInstalled="makeHikeControls"
                        />
                    </div>
                </div>

                <div
                    v-if="!isHideControls"
                    class="wrap-buttons"
                    :style="currentStep === 0 ? 'justify-content: flex-end' : ''"
                >
                    <at-button
                        v-if="currentStep !== 0"
                        type="primary"
                        class="wrap-buttons__button"
                        @click="changeStep(-1)"
                    >
                        {{ $t('setup.buttons.back') }}
                    </at-button>
                    <at-button
                        v-if="currentStep !== components.length - 1"
                        :disabled="isDisabledNext"
                        type="success"
                        class="wrap-buttons__button"
                        @click="changeStep(1)"
                    >
                        {{ $t('setup.buttons.next') }}
                    </at-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import Components from './Forms/allForms.js';

    export default {
        data() {
            let stateOfComponents = {};
            Components.forEach(el => {
                stateOfComponents[el.name] = { status: 'wait' };
            });
            return {
                currentStep: 0,
                currentComponent: {},
                stepsStatus: 'process',
                stepName: '',
                components: Components,
                stateOfComponents,
                isHideControls: false,
            };
        },
        created() {
            this.updateStatusOfCurrentComponent(this.currentStep);
        },
        watch: {
            currentStep(val) {
                this.updateStatusOfCurrentComponent(val);
            },
        },
        methods: {
            changeStep(value) {
                if (value === -1) {
                    this.stateOfComponents[this.stepName].status = 'wait';
                }
                this.currentStep += value;
            },
            updateStatusOfCurrentComponent(currentStep) {
                this.currentComponent = this.components[currentStep];
                this.stepName = this.currentComponent.name;
            },
            getStateOfCurrentComponent(state) {
                this.stateOfComponents = { ...this.stateOfComponents, ...state };
            },
            makeHikeControls(val) {
                this.isHideControls = val;
            },
        },
        computed: {
            currentStatusComponent() {
                return this.stateOfComponents[this.stepName].status;
            },
            isDisabledNext() {
                return this.currentStatusComponent !== 'finish';
            },
        },
    };
</script>

<style lang="scss" scoped>
    .form-wrap {
        margin-bottom: $layout-01;
        .header-text {
            margin-bottom: $layout-01;

            &__title,
            &__subtitle {
                text-align: center;
            }
        }
        &__component,
        &__header {
            display: flex;
            justify-content: center;
        }
    }
    .wrap-steps {
        display: flex;
        justify-content: center;
        margin-bottom: $layout-01;
    }
    .wrap-buttons {
        width: 100%;
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;

        &__button {
            margin: 0 20px;
            width: 100%;
            max-width: 100px;
        }
    }
</style>
