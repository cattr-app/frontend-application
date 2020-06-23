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

                <div class="row form-wrap">
                    <div class="col-8 col-offset-8">
                        <div class="header-text">
                            <h2 class="header-text__title">
                                {{ $t(`setup.header.${this.stepName}.title`) }}
                            </h2>
                            <p class="header-text__subtitle">
                                {{ $t(`setup.header.${this.stepName}.subtitle`) }}
                            </p>
                        </div>
                        <component
                            :is="currentComponent"
                            :storage="stateOfComponents"
                            @setState="getStateOfCurrentComponent"
                        />
                    </div>
                </div>

                <div class="wrap-buttons">
                    <at-button
                        :disabled="isDisabledNext"
                        type="success"
                        class="wrap-buttons__button"
                        @click="changeStep(1)"
                    >
                        Next<!--need translate -->
                    </at-button>
                    <at-button
                        v-if="currentStep !== 0"
                        type="primary"
                        class="wrap-buttons__button"
                        @click="changeStep(-1)"
                    >
                        Back
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
        padding: 2rem 0;
        .header-text {
            padding-bottom: 1rem;
        }
    }
    .wrap-steps {
        display: flex;
        width: 100%;
        justify-content: center;

        &__steps {
            width: 80%;
        }
    }
    .wrap-buttons {
        width: 100%;
        display: flex;
        justify-content: space-between;

        &__button {
            margin: 0 20px;
            width: 100%;
            max-width: 100px;
        }
    }
</style>
