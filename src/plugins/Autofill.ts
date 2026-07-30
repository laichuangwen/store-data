import type Table from '../Table'
import type { TablePlugin } from '../Table'

export class AutofillPlugin implements TablePlugin {
    private direction: 'down' | 'right' = 'down'
    down() {
      this.direction = 'down'
      return this
    }
    right() {
      this.direction = 'right'
      return this
    }
    install(_table: Table) {
      // 用 this.direction 注册自动填充逻辑
    }
  }
