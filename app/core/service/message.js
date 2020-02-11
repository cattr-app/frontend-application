import StoreService from './storeService';

export default class MessageService extends StoreService {
    updateMessage(message, type = 'info') {
        this.context.dispatch('setMessage', { message, type });
    }

    getMessage() {
        return {
            data: this.context.getters.message,
            type: this.context.getters.type,
        }
    }
}
