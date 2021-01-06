<template>
    <div class="color-readiness__item">
        <div class="color-readiness__color">
            <input
                id="input-color"
                type="color"
                class="at-input__original"
                :value="value"
                @change="$emit('change', $event.target.value)"
            />
        </div>
        <at-button class="color-readiness__remove" @click.prevent="$emit('change', null)">
            <span class="icon icon-x"></span>
        </at-button>
    </div>
</template>

<script>
    export default {
        props: {
            value: {},
        },
    };
</script>

<style lang="scss" scoped>
    #input-color[type='color'] {
        width: 170px;
        height: 40px;
        cursor: pointer;
        border-radius: 5px;
        padding: 0px;
        border: none;
    }
    .color-readiness {
        &__item {
            display: flex;
            flex-flow: row nowrap;
        }
        &__start,
        &__end,
        &__color {
            flex: 1;
            margin-right: 0.5em;
            margin-bottom: 0.75em;
        }
        &__remove {
            height: 40px;
        }
        &__color {
            max-width: 170px;
        }
    }
    input[type='color' i]::-webkit-color-swatch-wrapper,
    input[type='color' i]::-webkit-color-swatch {
        padding: 0px;
        border: none;
    }
</style>
