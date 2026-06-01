<template>
  <div class="product-list">
    <div class="page-header">
      <h2>商品管理</h2>
      <div class="header-actions">
        <el-button type="warning" @click="showLowStockAlert">低库存预警</el-button>
        <el-button type="primary" @click="showAddDialog">添加商品</el-button>
      </div>
    </div>

    <el-table :data="products" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="商品名称" />
      <el-table-column prop="category_name" label="分类" />
      <el-table-column prop="price" label="价格" width="100">
        <template #default="scope">
          ¥{{ scope.row.price.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.stock < 10 ? 'danger' : 'success'">
            {{ scope.row.stock }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
            {{ scope.row.status === 'active' ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button size="small" @click="showEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="warning" @click="showStockDialog(scope.row)">库存</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择分类">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="图片链接" prop="image_url">
          <el-input v-model="form.image_url" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="上架" value="active" />
            <el-option label="下架" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 库存管理对话框 -->
    <el-dialog v-model="stockDialogVisible" title="更新库存" width="400px">
      <el-form :model="stockForm" ref="stockFormRef" label-width="100px">
        <el-form-item label="商品名称">
          <span>{{ stockForm.name }}</span>
        </el-form-item>
        <el-form-item label="当前库存">
          <span>{{ stockForm.currentStock }}</span>
        </el-form-item>
        <el-form-item label="操作">
          <el-radio-group v-model="stockForm.operation">
            <el-radio label="set">设置为</el-radio>
            <el-radio label="increment">增加</el-radio>
            <el-radio label="decrement">减少</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="stockForm.quantity" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStockUpdate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProducts, createProduct, updateProduct, deleteProduct, updateStock } from '../api/productApi'
import { getCategories } from '../api/categoryApi'

const products = ref([])
const categories = ref([])
const dialogVisible = ref(false)
const stockDialogVisible = ref(false)
const dialogTitle = ref('添加商品')
const isEdit = ref(false)
const formRef = ref()
const stockFormRef = ref()

const form = ref({
  id: null,
  name: '',
  category_id: null,
  price: 0,
  stock: 0,
  description: '',
  image_url: '',
  status: 'active'
})

const stockForm = ref({
  id: null,
  name: '',
  currentStock: 0,
  operation: 'set',
  quantity: 0
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

const loadProducts = async () => {
  try {
    const res = await getProducts()
    products.value = res.data.data
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const loadCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = res.data.data
  } catch (error) {
    ElMessage.error('加载分类失败')
  }
}

const showAddDialog = () => {
  dialogTitle.value = '添加商品'
  isEdit.value = false
  form.value = { id: null, name: '', category_id: null, price: 0, stock: 0, description: '', image_url: '', status: 'active' }
  dialogVisible.value = true
}

const showEditDialog = async (row) => {
  dialogTitle.value = '编辑商品'
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const showStockDialog = (row) => {
  stockForm.value = {
    id: row.id,
    name: row.name,
    currentStock: row.stock,
    operation: 'set',
    quantity: 0
  }
  stockDialogVisible.value = true
}

const showLowStockAlert = async () => {
  try {
    const res = await getProducts() // 这里应该调用低库存API，但为了简化，我直接在前端过滤
    const lowStockProducts = res.data.data.filter(p => p.stock < 10)
    if (lowStockProducts.length === 0) {
      ElMessage.info('没有低库存商品')
    } else {
      ElMessageBox.alert(
        lowStockProducts.map(p => `${p.name}: ${p.stock}`).join('\n'),
        '低库存预警',
        { type: 'warning' }
      )
    }
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateProduct(form.value.id, form.value)
          ElMessage.success('更新成功')
        } else {
          await createProduct(form.value)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadProducts()
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '操作失败')
      }
    }
  })
}

const handleStockUpdate = async () => {
  try {
    await updateStock(stockForm.value.id, {
      stock: stockForm.value.quantity,
      operation: stockForm.value.operation
    })
    ElMessage.success('库存更新成功')
    stockDialogVisible.value = false
    loadProducts()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该商品吗？', '提示', { type: 'warning' })
    await deleteProduct(id)
    ElMessage.success('删除成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadProducts()
  loadCategories()
})
</script>

<style scoped>
.product-list {
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
</style>
