<template>
    <div>
        <div class="form-inputs row" ref="email-input" v-for="(email, index) in emails" :key="index">
            <validation-provider v-slot="{ errors }" rules="email" :vid="`index${index}`" name=" ">
                <at-input 
                    :name="`email${index}`" 
                    :class="(errors.length === 0 
                        ? '' 
                        : ' at-select--error at-input--error has-error') + ' email-input'" 
                    :value="email" 
                    @blur="handleEmails($event, index)"
                />
                <small class="error123">{{ errors[0] }}</small>
            </validation-provider>
            <at-button  icon="icon-minus-circle" @click="removeInput(index)" circle type="error" />

        </div>
        
        <at-button @click="addInput" type="primary" >{{ $t('field.events.add') }}</at-button>
  </div>
</template>

<script>
import {ValidationProvider} from 'vee-validate';

export default {
    components: {ValidationProvider},
    props: {
        emails: Array,
    },
    methods: {
        addInput () {
            this.$emit('addInput', [''])
        },
        removeInput(indexEmail) {
            if (this.$refs['email-input'].length === 1) {
                return;
            }

            this.$emit('removeInput', indexEmail)
        },
        handleEmails(ev, index) {
            const email = ev.target.value;
            this.$emit('updateProps', email, index)
            this.$forceUpdate();
        }
    },
}
</script>
