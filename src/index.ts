import Store, { type TreeNodeData } from './Store'

let columns: any[] = [
    // {
    //   title: "序号",
    //   key: "index",
    //   type: "index",
    //   fixed: "left",
    //   width: 50,
    // },
    {
        title: '工号',
        key: 'emp_no',
        align: 'left',
        // operation: true,
        readonly: false,
        width: 120,
        type: 'tree-selection',
        dragRow: true,
        fixed: 'left',
        // hide: () => 3 > 2,
    },
    // {
    //     key: 'selection',
    //     type: 'index-selection',
    //     fixed: 'left',
    //     title: '',
    //     align: 'left',
    //     minWidth: 50,
    //     // operation: true,
    //     dragRow: true,
    //     // dragDisabled: true,
    //     widthFillDisable: true,
    // },
    // {
    //     key: 'id',
    //     width: 100,
    //     title: 'ID',
    //     fixed: 'left',
    //     // dragRow: true,
    //     minWidth: 80,
    //     maxWidth: 200,
    // },
    // {
    //   key: "selection",
    //   type: "index-selection",
    //   width: 100,
    //   fixed: "left",
    // },
    {
        title: '姓名',
        key: 'emp_name',
        width: 100,
        fixed: 'left',
        align: 'left',
        // dragRow: true,
        // type: 'selection',
        hoverIconName: 'icon-edit',
        placeholder: '请输入',
        // maxLineClamp: 3,
        // editorType: 'none',
        verticalAlign: 'middle',
        // hide: true,
        // render: (pEl, cell) => {
        //     const cellEl = document.createElement('div');
        //     cellEl.addEventListener('click', () => {
        //         console.log('点击了姓名');
        //     });
        //     cellEl.style.opacity = '0.5';
        //     cellEl.style.backgroundColor = 'cyan';

        //     cellEl.innerHTML = cell.text;
        //     pEl.appendChild(cellEl);
        // },
        // render: "emp_name",
    },
    // {
    //   title: '部门',
    //   key: 'dep_name',
    //   size: 'large',
    //   align: 'left',
    //   readonly: true,
    //   // fixed: 'right',
    //   overflowTooltipShow: true,
    //   overflowTooltipWidth: 300,
    //   overflowTooltipPlacement: 'left-end',
    //   renderFooter(cell: any) {
    //     return h('span', {
    //       class: 'text',
    //     }, 'heji部门');
    //   },
    // },
    {
        title: '岗位',
        key: 'job_name',
        // fixed: 'left',
        width: 200,
        align: 'left',
        children: [
            {
                title: '姓名1',
                key: 'emp_name1',
                align: 'left',
                fixed: 'left',
                children: [
                    {
                        title: '姓名11',
                        key: 'emp_name11',
                        // verticalAlign: 'middle',
                        readonly: false,
                        width: 200,
                        maxLineClamp: 2,
                        rules: {
                            required: true,
                            message: '该项必填哦！',
                            // validator(rule, value, callback) {
                            //     if (!value) {
                            //         callback('请输入岗位');
                            //     } else if (value.length > 10) {
                            //         callback('岗位字段长度必须小于10个字符哦！');
                            //     } else {
                            //         callback();
                            //     }
                            // },
                        },
                        children: [
                            {
                                title: '姓名111',
                                key: 'emp_name111',
                                align: 'left',
                                width: 200,
                            },
                            {
                                title: '姓名112',
                                key: 'emp_name112',
                                // hide: true,
                            },
                            {
                                title: '姓名113',
                                key: 'emp_name113',
                                // hideDisabled: true,
                            },
                        ],
                    },
                    {
                        title: '姓名22',
                        key: 'emp_name22',
                        children: [
                            {
                                title: '姓名221',
                                key: 'emp_name221',
                                align: 'left',
                                width: 200,
                            },
                            {
                                title: '姓名222',
                                key: 'emp_name222',
                                // hide: true,
                            },
                            {
                                title: '姓名223',
                                key: 'emp_name223',
                                // hideDisabled: true,
                            },
                        ],
                    },
                ],
            },
            {
                title: '姓名2',
                key: 'emp_name2',
            },
        ],
    },
    {
        title: '手机号',
        key: 'phone',
        maxLineClamp: 'auto',
        sortBy: 'string',
        align: 'center',
        verticalAlign: 'bottom',
        // fixed: 'right',
        // readonly: false,
        // overflowTooltipHeaderShow: true,
        // formatterFooter: ({ value }) => {
        //     return `合：${value}`;
        // },
        width: 100,
        // renderHeader: (pEl, cell) => {
        //     const cellEl = document.createElement('div');
        //     cellEl.style.width = '100%';
        //     cellEl.style.height = '100%';
        //     cellEl.style.opacity = '0.5';
        //     // cellEl.style.backgroundColor = 'cyan';
        //     cellEl.style.display = 'flex';
        //     cellEl.style.justifyContent = 'center';
        //     cellEl.style.alignItems = 'center';
        //     cellEl.style.userSelect = 'text';
        //     cellEl.innerHTML = cell.text;
        //     pEl.appendChild(cellEl);
        // },
    },
    {
        title: '性别',
        key: 'sex',
        // readonly: false,
        // render: "sex",
        // rules: [
        //     {
        //         validator: (rule, value, callback) => {
        //             if (!value) {
        //                 callback('该项必填哦！');
        //             } else {
        //                 callback();
        //             }
        //         },
        //     },
        // ],
        renderHeader: (pEl, cell) => {
            const cellEl = document.createElement('div');
            cellEl.style.width = '100%';
            cellEl.style.height = '100%';
            cellEl.style.opacity = '0.5';
            cellEl.style.lineHeight = '1.2';
            cellEl.style.color = 'red';
            cellEl.style.fontSize = '12px';
            // cellEl.style.backgroundColor = 'cyan';
            cellEl.style.display = 'flex';
            cellEl.style.justifyContent = 'center';
            cellEl.style.alignItems = 'center';
            cellEl.style.userSelect = 'text';
            cellEl.innerHTML = cell.text;
            pEl.appendChild(cellEl);
        },
        render: (pEl, cell) => {
            const cellEl = document.createElement('div');
            cellEl.style.width = '100%';
            cellEl.style.opacity = '0.5';
            cellEl.style.backgroundColor = 'cyan';
            cellEl.style.display = 'block';
            // cellEl.style.justifyContent = 'center';
            // cellEl.style.alignItems = 'center';
            cellEl.style.whiteSpace = 'pre-line';
            cellEl.style.userSelect = 'text';
            cellEl.innerHTML = cell.text;
            cellEl.className = 'evt-body-cell-auto-height';
            cellEl.dataset.rowIndex = cell.rowIndex;
            cellEl.dataset.visibleWidth = cell.visibleWidth;
            cellEl.dataset.visibleHeight = cell.visibleHeight;
            pEl.appendChild(cellEl);
        },
    },
    {
        title: '计薪月份',
        // fixed: "right",
        key: 'salary_month',
        align: 'right',
        hoverIconName: 'icon-select',
        sort: 4,
        width: 200,
    },
    {
        title: '出生日期',
        key: 'birthday',
        editorType: 'date',
        hoverIconName: 'icon-date',
        sort: 2,
    },
    {
        title: '工作地址',
        key: 'work_address',
        formatter: ({ value }) => {
            return `工作11地址：${value}`;
        },
    },
    {
        title: '家庭地址',
        key: 'address',
        headerAlign: 'center',
        align: 'left',
        readonly: false,
        width: 250,
        // overflowTooltipShow: false,
        overflowTooltipMaxWidth: 200,
        overflowTooltipPlacement: 'top',
        // readonly: false,
        // rules: {
        //     required: true,
        //     message: '该项必填哦！',
        // },
        render: (pEl, cell) => {
            const cellEl = document.createElement('div');
            // 添加事件
            cellEl.addEventListener('click', () => {
                console.log('点击了家庭地址');
            });
            cellEl.style.minHeight = '36px';
            cellEl.style.opacity = '0.5';
            // cellEl.style.backgroundColor = 'cyan';
            cellEl.style.flex = 'none';
            cellEl.style.display = 'block';
            cellEl.style.padding = '8px';
            // cellEl.style.justifyContent = 'center';
            // cellEl.style.alignItems = 'center';
            // cellEl.style.whiteSpace = 'pre-line';
            cellEl.style.userSelect = 'text';
            // cellEl.style.border = '1px solid red';
            cellEl.style.overflowWrap = 'break-word';
            cellEl.innerHTML = cell.value || ''; // 设置单元格内容
            pEl.appendChild(cellEl);
        },
    },
    {
        title: '请假开始时间',
        key: 'start_dt',
    },
    {
        title: '物料编码',
        key: 'materialNo',
        align: 'right',
        selectorCellValueType: 'displayText', // displayText | value
        formatter({ value }: { value: string }) {
            if (!value) {
                return '';
            }
            const v = parseFloat(value);
            return `物料编码：${v}`;
        },
    },
    {
        title: '数量',
        key: 'requiredQuantity',
        rules: [
            {
                required: true, // TODO:表格1.2.19有问题
                pattern: /^(0|[1-9]\d*)$/,
                message: '请输入0或正整数',
                validator(rule, value, callback) {
                    if (value > 10) {
                        callback('数量不能大于10');
                    } else {
                        callback();
                    }
                },
            },
        ],
        align: 'right',
    },
    { title: '单位', key: 'unit' },
    { title: '工作性质', key: 'work_type' },
    { title: '工作状态', key: 'work_status' },
    { title: '户籍城市', key: 'household_city' },
    { title: '户籍地址', key: 'household_address' },
    { title: '民族', key: 'nation' },
    // { title: '工作地址', key: 'work_address' },
    {
        title: '工作邮箱',
        key: 'work_email',
        // rule: {
        //   required: true, message: '请输入邮箱地址'
        // },
    },
    { title: '个人邮箱', key: 'email' },
    {
        title: '工龄',
        key: 'work_age',
    },
    { title: '司龄', key: 'company_age' },
    { title: '合同公司', key: 'contract_company' },
    { title: 'qq号', key: 'qq' },
    { title: '年龄', key: 'age' },
    { title: '品牌', key: 'brandName' },
    { title: '商品名称', key: 'goodsName' },
    { title: '规格型号', key: 'sn' },
    { title: '客户备注', key: 'customerRemarks' },
    {
        title: '采购价(元)',
        key: 'purchasePrice',
        fixed: 'right',
        required: true,
        align: 'right',
        // verticalAlign: 'top',
        // type: 'number',
        rules: [
            {
                required: true,
                message: '请输入',
            },
            {
                // required: false,
                message: '最多输入两位小数',
                // 只能输入数字或小数点，且小数点后最多两位
                pattern: /^(\d+(\.\d{1,2})?|\.?\d{1,2})$/,
            },
        ],
    },
    {
        title: '销售价(元)',
        fixed: 'right',
        key: 'salePrice',
        type: 'number',
        align: 'left',
        hoverIconName: 'icon-edit',
        placeholder: '请输入',
        precision: 2,
        min: 0,
        max: 100,
        // readonly: true,
        rules: [
            {
                required: true,
                message: '最多输入两位小数',
                pattern: /^(\d+(\.\d{1,2})?|\.?\d{1,2})$/,
            },
        ],
    },
    {
        title: '操作',
        key: 'hander',
        fixed: 'right',
    },
];
let data: any[] = [];
for (let i = 0; i < 20; i += 1) {
    data.push({
        _height: [3, 5, 6, 7].includes(i) ? 60 : 0,
        id: `${i}`,
        // _readonly: true,
        emp_name: `张三${i % 5 ? 1 : 0}`,
        emp_name11: `张三${i % 5 ? 1 : 0}`,
        emp_name221: `张三${i % 5 ? 1 : 0}`,
        emp_name222: `张三${i % 5 ? 1 : 0}`,
        emp_name2: `张三${i % 5 ? 1 : 0}`,
        emp_no: i,
        dep_name: ['zhinan', 'shejiyuanze', 'yizhi'],
        job_name: i === 5 ? '产品经理测试很长的名字' : `产品经理${i}`,
        phone: i === 4 ? '13159645561a' : `${13159645561 + i}`,
        // eslint-disable-next-line no-nested-ternary
        sex: i % 4 === 0 ? 1 : i === 3 ? null : 2,
        address:
            // eslint-disable-next-line no-nested-ternary
            i === 1
                ? `海淀区北京路海淀区北京路十分地海淀区北京路海淀区北京路十分地海淀区北京路海淀区北京路十分地${i}号`
                : i === 4
                    ? '海淀区北京路海淀区北京路十分地海淀区北京路海淀区北京路十分地海淀区北京路海淀区北京路十分地海淀区北京路海淀区北京路十分地海淀区北京路海淀区北京路十分地海淀区北京路海淀区北京路十分地海淀区北京路海淀区北京路十分地海淀区北京路海淀区北京路十分地海淀区北京路海淀区北京路十分地'
                    : `海淀区北京路${i}号`,
        work_type: `兼职${i}`,
        work_status: `在职${i}`,
        household_city: `深圳${i}`,
        household_address: `深南大道${i}号`,
        nation: `汉${i}`,
        work_address: `南京路${i}号`,
        work_email: `${28976633 + i}@qq.com`,
        email: `${4465566 + i}@qq.com`,
        work_age: 2 + i,
        company_age: 1 + i,
        contract_company: `飞鸟物流公司${i}`,
        qq: 35860567 + i,
        salary_month: `${1996 + i}-09`,
        birthday: `${1996 + i}-09-21`,
        age: 1 + i,
        brandName: `博世${i}`,
        goodsName: `电钻${i}`,
        sn: `SDFSD${i}`,
        materialNo: `1231${i}`,
        unit: '个',
        requiredQuantity: 10,
        customerRemarks: `测试测试${i}`,
        purchasePrice: 10.2 + i,
        salePrice: 12.3 + i,
        children: [
            {
                id: `${i}-1`,
                emp_no: `${i}-1`,
                emp_name: `张三${i}-1`,
                children: [],
            },
            {
                id: `${i}-2`,
                emp_no: `${i}-2`,
                emp_name: `张三${i}-2`,
                children: [
                    {
                        id: `${i}-2-1`,
                        emp_no: `${i}-2-1`,
                        emp_name: `张三${i}-2-1`,
                        children: [],
                    },
                    {
                        id: `${i}-2-2`,
                        emp_no: `${i}-2-2`,
                        emp_name: `张三${i}-2-2`,
                        children: [
                            {
                                id: `${i}-2-2-1`,
                                emp_no: `${i}-2-2-1`,
                                emp_name: `张三${i}-2-2-1`,
                                children: [],
                            },
                        ],
                    },
                    {
                        id: `${i}-2-3`,
                        emp_no: `${i}-2-3`,
                        emp_name: `张三${i}-2-3`,
                        children: [],
                    },
                ],
            },
        ],
    });
}
for (let i = 0; i < 0; i += 1) {
    columns.push({
        title: `表头${i}`,
        key: `sc_name${i}`,
        readonly: true,
        align: 'right',
    });
}

const store = new Store({
    columns,
    data,
});

console.log(store.rowNodeMaps.size, columns);

