export type RowNodeProps = {
    data: Record<string, any>;
    store: Store;
};
type RowNodeKey = string | number;
export type CheckState = 'unchecked' | 'checked' | 'indeterminate';
type RowData = Record<string, any>;
type RowSelectableParams = {
    row: RowData;
    rowIndex: number;
}
type RowSelectable = (params: RowSelectableParams) => boolean;
function generateShortUUID(): string {
    return 'xxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
class RowStore {
    dataIndex = 0;
    rowIndex = 0;
    minHeight = 0;
    maxHeight = 0;
    height = 16;
    calculatedHeight = 0;
    expand = false;
    expandLazy = false;
    expandLoading = false;
    visible = true;
    checkState: CheckState = 'unchecked';
    constructor() {
    }
}
class ColStore {
    width = 100;
    key = generateShortUUID();
    constructor() {
    }
}
export type ColNodeProps = {
    column: Column;
    store: Store;
};
export type Column = {
    key: string;
    title: string;
    children?: Column[];
};
class ColNode {
    private store: Store;
    private colStore: ColStore;
    column: Column;
    parentNode: ColNode | null = null;
    childrenNodes: ColNode[] = [];
    constructor(props: ColNodeProps) {
        this.store = props.store;
        this.colStore = new ColStore();
        this.column = props.column;
        this.initChildrenNodes(props.column);
    }
    get isRoot(): boolean {
        return this.key === this.store.rootColKey;
    }
    get key(): string {
        return this.column.key;
    }
    get level(): number {
        if (this.isRoot) return -1;
        return this.parentNode ? this.parentNode.level + 1 : 0;
    }
    get parentColKeys(): string[] {
        return this.parentNode ? this.parentNode.parentColKeys.concat(this.parentNode.key) : [];
    }
    get hasChildren(): boolean {
        return this.childrenNodes.length > 0;
    }
    get parentColKey(): string {
        return this.parentNode?.key ?? '';
    }
    get isLastChild(): boolean {
        if (!this.parentNode) return false;
        return this.parentNode.childrenNodes.length === this.parentNode.childrenNodes.indexOf(this) + 1;
    }
    private initChildrenNodes(column: Column) {
        const { children } = column;
        if (!Array.isArray(children)) return;
        for (const child of children) {
            const colNode = new ColNode({
                column: child,
                store: this.store,
            });
            this.addChildNode(colNode);
        }
    }

    private addChildNode(child: ColNode) {
        child.parentNode = this;
        this.childrenNodes.push(child);
        this.store!.addColNodeMap(child);
    }
    getMaxColLevel(): number {
        let maxLevel = this.level;
        for (const child of this.childrenNodes) {
            maxLevel = Math.max(maxLevel, child.getMaxColLevel());
        }
        return maxLevel;
    }
}
class RowNode {
    private store: Store;
    private rowStore: RowStore;
    uuid: string = generateShortUUID();
    data: RowData = {};
    parentNode: RowNode | null = null;
    childrenNodes: RowNode[] = [];
    constructor(props: RowNodeProps) {
        this.data = props.data;
        this.store = props.store;
        const rowStore = this.store.getRowStore(this.key);
        if (rowStore) {
            this.rowStore = rowStore;
        } else {
            this.rowStore = new RowStore();
            this.store.setRowStore(this.key, this.rowStore);
        }
        this.initChildrenNodes(props.data);
    }
    get height(): number {
        return this.rowStore.height;
    }
    get isRoot(): boolean {
        return this.key === this.store.rootKey;
    }
    get key(): RowNodeKey {
        const { uuidKey } = this.store;
        if (uuidKey && this.data[uuidKey]) {
            return this.data[uuidKey];
        }
        return this.uuid;
    }
    get readonly(): boolean {
        return this.data?._readonly ?? false;
    }
    get level(): number {
        if (this.isRoot) return -1;
        return this.parentNode ? this.parentNode.level + 1 : 0;
    }
    get parentRowKeys(): RowNodeKey[] {
        return this.parentNode ? this.parentNode.parentRowKeys.concat(this.parentNode.key) : [];
    }
    get hasChildren(): boolean {
        return this.childrenNodes.length > 0;
    }
    get parentRowKey(): RowNodeKey {
        return this.parentNode?.key ?? '';
    }
    get isLastChild(): boolean {
        if (!this.parentNode) return false;
        return this.parentNode.childrenNodes.length === this.parentNode.childrenNodes.indexOf(this) + 1;
    }
    set expand(expand: boolean) {
        this.rowStore.expand = expand;
    }
    get expand(): boolean {
        return this.rowStore.expand;
    }
    private initChildrenNodes(data: Record<string, any>) {
        if (!this.store.hasTree && !this.isRoot) return;
        const { childrenKey } = this.store;
        const children = data[childrenKey];
        if (!Array.isArray(children)) return;
        for (const child of children) {
            const rowNode = new RowNode({
                data: child,
                store: this.store,
            });
            this.addChildNode(rowNode);
        }
    }

    private addChildNode(child: RowNode) {
        child.parentNode = this;
        this.childrenNodes.push(child);
        this.store!.addRowNodeMap(child);
    }
    getSumHeight(): number {
        let sumHeight = 0;
        // 先计算子节点高度
        for (const child of this.childrenNodes) {
            sumHeight += child.height;
            if (child.expand) {
                sumHeight += child.getSumHeight();
            }
        }
        return sumHeight;
    }
    getExpand(): boolean {
        return this.rowStore.expand;
    }
    setExpand(expand: boolean) {
        this.rowStore.expand = expand;
    }
    getCheckState(): CheckState {
        return this.rowStore.checkState;
    }
    setChecked(state: CheckState, ignoreChild: boolean = false) {
        if (!this.getSelectable()) {
            return;
        }
        this.rowStore.checkState = state;
        if (!ignoreChild) {
            for (const child of this.childrenNodes) {
                child.setChecked(state);
            }
        }
        if (this.parentNode) {
            const siblings = this.parentNode.childrenNodes;
            const enabledSiblings = siblings.filter((s: RowNode) => s.getSelectable());
            const totalEnabled = enabledSiblings.length;
            const checkedCount = enabledSiblings.filter((s: RowNode) => s.getCheckState() === 'checked').length;
            const hasIndeterminate = enabledSiblings.some((s: RowNode) => s.getCheckState() === 'indeterminate');
            let checkState: CheckState = 'unchecked';
            if (checkedCount === totalEnabled) {
                checkState = 'checked';
            } else if (checkedCount > 0 || hasIndeterminate) {
                checkState = 'indeterminate';
            }
            this.parentNode.setChecked(checkState, true);
        }
    }
    getSelectable(): boolean {
        if (this.store?.rowSelectable && typeof this.store.rowSelectable === 'function') {
            return this.store.rowSelectable({ row: this.data, rowIndex: this.rowStore.rowIndex });
        }
        return true;
    }
    setValue(key: string, value: any) {
        this.data[key] = value;
    }
}


class Store {
    private rootRowNode!: RowNode;
    private rootColNode!: ColNode;
    rootKey = 'root_evt';
    uuidKey = 'id';
    childrenKey = 'children';
    rootColKey = 'root_col_evt';
    childrenColKey = 'children';
    hasTree = true;
    hasSelection = false;
    maxColLevel = 0;
    columns: any[] = [];
    data: any[] = [];
    rowStoreMaps: Map<RowNodeKey, RowStore> = new Map();
    colStoreMaps: Map<string, ColStore> = new Map();
    rowNodeMaps: Map<RowNodeKey, RowNode> = new Map();
    colNodeMaps: Map<string, ColNode> = new Map();
    rowSelectable: RowSelectable | undefined;
    constructor(props: { columns: any[]; data: any[] }) {
        const { columns, data } = props;
        this.columns = columns;
        this.data = data;
        const rootColData = {
            key: this.rootColKey,
            title: '',
            children: this.columns,
        };
        this.rootColNode = new ColNode({
            column: rootColData,
            store: this,
        });
        const rootRowData = {
            [this.uuidKey]: this.rootKey,
            [this.childrenKey]: this.data,
        };
        this.rootRowNode = new RowNode({
            data: rootRowData,
            store: this,
        });
    }
    get rowNodes(): RowNode[] {
        return this.rootRowNode.childrenNodes;
    }
    get colNodes(): ColNode[] {
        return this.rootColNode.childrenNodes;
    }
    getMaxColLevel(): number {
        return this.rootColNode.getMaxColLevel();
    }
    getSumHeight(): number {
        return this.rootRowNode.getSumHeight();
    }
    getRowStore(key: RowNodeKey) {
        return this.rowStoreMaps.get(key);
    }
    setRowStore(key: RowNodeKey, rowStore: RowStore) {
        this.rowStoreMaps.set(key, rowStore);
    }
    getRowNode(key: RowNodeKey) {
        if (!this.rowNodeMaps.has(key)) {
            console.error(`Node not found: ${key}`);
            return;
        }
        return this.rowNodeMaps.get(key);
    }
    addRowNodeMap(node: RowNode) {
        if (this.rowNodeMaps.has(node.key)) {
            console.warn(`Duplicate keys detected: ${node.key}`);
        };
        this.rowNodeMaps.set(node.key, node);
    }
    getColStore(key: string) {
        return this.colStoreMaps.get(key);
    }
    setColStore(key: string, colStore: ColStore) {
        this.colStoreMaps.set(key, colStore);
    }
    getColNode(key: string) {
        return this.colNodeMaps.get(key);
    }
    addColNodeMap(node: ColNode) {
        if (this.colNodeMaps.has(node.key)) {
            console.warn(`Duplicate keys detected: ${node.key}`);
        };
        this.colNodeMaps.set(node.key, node);
    }
    setChecked(key: RowNodeKey, state: CheckState) {
        const node = this.getRowNode(key);
        if (node) node.setChecked(state);
    }
    getStoreCheckState(): CheckState {
        return this.rootRowNode.getCheckState();
    }
    setExpand(key: RowNodeKey, expanded: boolean) {
        const node = this.getRowNode(key);
        if (node) node.setExpand(expanded);
    }
    /** 根据当前树生成扁平/树形节点数据，用于展示或调试 */
    getNodeDataTree(): TreeNodeData[] {
        const toData = (node: RowNode): TreeNodeData => ({
            key: node.key,
            level: node.level,
            checkState: node.getCheckState(),
            hasChildren: node.hasChildren,
            expand: node.getExpand(),
            parentKey: node.parentRowKey || null,
            children: node.childrenNodes.map(toData),
        });
        return this.rowNodes.map(toData);
    }
}

export type TreeNodeData = {
    key: RowNodeKey;
    level: number;
    checkState: CheckState;
    hasChildren: boolean;
    expand: boolean;
    parentKey: RowNodeKey | null;
    children: TreeNodeData[];
};

export default Store;