<template>
  <div class="order-list">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-actions">
        <el-select v-model="statusFilter" placeholder="订单状态" clearable @change="loadOrders">
          <el-option label="待付款" value="pending" />
          <el-option label="已付款" value="paid" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
      </div>
    </div>

    <el-table :data="orders" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="order_no" label="订单编号" width="180" />
      <el-table-column prop="owner_name" label="客户" />
      <el-table-column prop="total_amount" label="总金额" width="120">
        <template #default="scope">
          ¥{{ scope.row.total_amount.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button size="small" @click="showDetailDialog(scope.row)">详情</el-button>
          <el-button 
            v-if="scope.row.status === 'pending'" 
            size="small" 
            type="success" 
            @click="updateStatus(scope.row.id, 'paid')"
          >
            付款
          </el-button>
          <el-button 
            v-if="scope.row.status === 'paid'" 
            size="small" 
            type="primary" 
            @click="updateStatus(scope.row.id, 'completed')"
          >
            完成
          </el-button>
          <el-button 
            v-if="scope.row.status === 'pending' || scope.row.status === 'paid'" 
            size="small" 
            type="danger" 
            @click="handleCancelOrder(scope.row.id)"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="loadOrders"
      @current-change="loadOrders"
      class="pagination"
    />

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="800px">
      <div v-if="orderDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单编号">{{ orderDetail.order_no }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ orderDetail.owner_name }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ orderDetail.owner_phone }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(orderDetail.status)">
              {{ getStatusText(orderDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ orderDetail.total_amount.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ orderDetail.payment_method || '未支付' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ orderDetail.created_at }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ orderDetail.remarks || '无' }}</el-descriptions-item>
        </el-descriptions>

        <h3 style="margin-top: 20px;">订单商品</h3>
        <el-table :data="orderDetail.items" stripe>
          <el-table-column prop="product_name" label="商品名称" />
          <el-table-column prop="price" label="单价" width="120">
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="subtotal" label="小计" width="120">
            <template #default="scope">
              ¥{{ scope.row.subtotal.toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrders, getOrderById, updateOrderStatus, cancelOrder } from '../api/orderApi'

const orders = ref([])
const orderDetail = ref(null)
const detailDialogVisible = ref(false)
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadOrders = async () => {
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    const res = await getOrders(params)
    orders.value = res.data.data
    total.value = res.data.pagination.total
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const showDetailDialog = async (row) => {
  try {
    const res = await getOrderById(row.id)
    orderDetail.value = res.data.data
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载详情失败')
  }
}

const updateStatus = async (id, status) => {
  try {
    const statusText = status === 'paid' ? '付款' : '完成'
    await ElMessageBox.confirm(`确定${statusText}该订单吗？`, '提示', { type: 'warning' })
    await updateOrderStatus(id, { status })
    ElMessage.success(`${statusText}成功`)
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const handleCancelOrder = async (id) => {
  try {
    await ElMessageBox.confirm('确定取消该订单吗？取消后库存将恢复。', '提示', { type: 'warning' })
    await cancelOrder(id)
    ElMessage.success('订单取消成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'paid': 'primary',
    'completed': 'success',
    'cancelled': 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'pending': '待付款',
    'paid': '已付款',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return map[status] || status
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.page-header h2 {
  margin: 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
