// Actions module exports
export {
    actionRegistry,
    getActionDefinition,
    validatePayload,
    getActionIds,
    getActionsForUI,
    type ActionRegistry,
    type RegisteredActionID,
} from './registry';

export {
    handleAddToCart,
    handleBuyNow,
    handleApplyDiscount,
    handleSubmitForm,
} from './handlers';

export {
    serverActionHandlers,
    isServerAction,
    type ServerActionHandlers,
    type ServerActionID,
} from './config';

export {
    useActionDispatcher,
    type DispatchResult,
    type UseActionDispatcherOptions,
} from './dispatcher';
