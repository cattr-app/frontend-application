export function getMimeType(extension) {
    switch(extension) {
        case 'csv':
            return 'text/csv';

        case 'xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        case 'pdf':
            return 'application/pdf';

        default:
            return 'application/octet-stream';
    }
}

export function downloadBlob(blob, fileName) {
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
    }
}
