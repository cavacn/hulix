import app from '../../module'
app.filter('filterExample', () => {
    return (raw) => {
        return raw.toLocaleUpperCase()
    }
})