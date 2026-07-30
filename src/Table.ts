export interface TablePlugin {
    install(table: Table): void
}
class Table {
    private plugins: TablePlugin[] = []
    use(plugin: TablePlugin) {
        this.plugins.push(plugin)
        plugin.install(this)
        return this
    }
}
export default Table