<template>
    <div class="dropdown">
        <at-dropdown :placement="position" :trigger="trigger" @on-dropdown-command="onExport">
            <at-button type="text">
                <span class="icon icon-save" />
            </at-button>

            <at-dropdown-menu slot="menu">
                <at-dropdown-item name="csv">CSV</at-dropdown-item>
                <at-dropdown-item name="xlsx">XLSX</at-dropdown-item>
                <at-dropdown-item name="pdf">PDF</at-dropdown-item>
            </at-dropdown-menu>
        </at-dropdown>
    </div>
</template>

<script>
    export default {
        name: 'ExportDropdown',
        props: {
            position: {
                type: String,
                default: 'bottom-left',
            },
            trigger: {
                type: String,
                default: 'click',
            },
        },
        methods: {
            onExport(format) {
                this.$emit('export', format);
            },
            onClose() {
                this.$emit('close');
            },
        },
    };
</script>

<style lang="scss" scoped>
    .dropdown {
        display: block;
        width: 40px;
        height: 40px;

        display: flex;
        align-items: center;
        justify-content: center;

        &::v-deep .at-btn__text {
            color: #2e2ef9;
            font-size: 25px;
        }
    }

    .at-dropdown-menu {
        right: 5px;
        border-radius: 10px;
    }
</style>
