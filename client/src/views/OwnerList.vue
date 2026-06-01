<template>
  <div class="owner-list">
    <div class="page-header">
      <h2>主人管理</h2>
      <el-button type="primary" @click="showAddDialog">添加主人</el-button>
    </div>

    <el-table :data="owners" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="phone" label="电话" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="address" label="地址" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="showEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOwners, getOwnerById, createOwner, updateOwner, deleteOwner } from '../api/ownerApi'

const owners = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加主人')
const isEdit = ref(false)
const formRef = ref()

const form = ref({
  id: null,
  name: '',
  phone: '',
  email: '',
  address: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }]
}

const loadOwners = async () => {
  try {
    const res = await getOwners()
    owners.value = res.data.data
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const showAddDialog = () => {
  dialogTitle.value = '添加主人'
  isEdit.value = false
  form.value = { id: null, name: '', phone: '', email: '', address: '' }
  dialogVisible.value = true
}

const showEditDialog = async (row) => {
  dialogTitle.value = '编辑主人'
  isEdit.value = true
  try {
    const res = await getOwnerById(row.id)
    form.value = res.data.data
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载详情失败')
  }
}

const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateOwner(form.value.id, form.value)
          ElMessage.success('更新成功')
        } else {
          await createOwner(form.value)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadOwners()
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '操作失败')
      }
    }
  })
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该主人吗？', '提示', { type: 'warning' })
    await deleteOwner(id)
    ElMessage.success('删除成功')
    loadOwners()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadOwners()
})
</script>

<style scoped>
.owner-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
}
</style>
