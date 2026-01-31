import get from 'lodash/get'; // We might need lodash or just simple split

export const resolveProps = (props: any, contextData: any) => {
    if (!props.bindings) return props;

    const resolvedProps = { ...props };

    Object.keys(props.bindings).forEach(key => {
        const path = props.bindings[key];
        if (path && contextData) {
            // Simple path resolution: 'product.name' -> contextData.product.name
            // We can use a helper or simple split/reduce
            const value = path.split('.').reduce((acc: any, part: string) => acc && acc[part], contextData);
            if (value !== undefined) {
                resolvedProps[key] = value;
            }
        }
    });

    return resolvedProps;
};
