
export function getUserRoles(user) {
    const roles = [];
    if (user.role) {
        roles.push(user.role.name);
    }

    if (user.projects_relation) {
        const projectRoles = Object.values(user.projects_relation)
            .map(relation => relation.role ? relation.role.name : null)
            .filter(role => role);
        roles.push(...projectRoles);
    }

    return roles;
}

export function havePermission(allowedRules, permission) {
    if (typeof permission === "function") {
        return permission();
    }

    const [object, action] = permission.split('/');
    return Object.keys(allowedRules).some(rule => allowedRules[rule].object === object && allowedRules[rule].action === action);
}

export function havePermissions(allowedRules, permissions) {
    return permissions.every(permission => havePermission(allowedRules, permission));
}
