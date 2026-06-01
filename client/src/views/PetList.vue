<template>
  <div class="pet-list">
    <div class="page-header">
      <h2>宠物管理</h2>
      <el-button type="primary" @click="showAddDialog">添加宠物</el-button>
    </div>

    <el-table :data="pets" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="宠物名字" />
      <el-table-column prop="species" label="品种" />
      <el-table-column prop="breed" label="具体品种" />
      <el-table-column prop="age" label="年龄" width="80" />
      <el-table-column prop="gender" label="性别" width="80" />
      <el-table-column prop="color" label="颜色" />
      <el-table-column prop="owner_name" label="主人" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="showEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="宠物名字" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="品种" prop="species">
          <el-select v-model="form.species" placeholder="请选择品种">
            <el-option label="猫" value="猫" />
            <el-option label="狗" value="狗" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="具体品种" prop="breed">
          <el-input v-model="form.breed" />
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="form.age" :min="0" :max="30" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="form.gender" placeholder="请选择性别">
            <el-option label="雄性" value="male" />
            <el-option label="雌性" value="female" />
            <el-option label="未知" value="unknown" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-input v-model="form.color" />
        </el-form-item>
        <el-form-item label="体重(kg)" prop="weight">
          <el-input-number v-model="form.weight" :min="0" :max="100" :precision="2" />
        </el-form-item>
        <el-form-item label="主人" prop="owner_id">
          <el-select v-model="form.owner_id" placeholder="请选择主人">
            <el-option v-for="owner in owners" :key="owner.id" :label="owner.name" :value="owner.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="form.remarks" type="textarea" />
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
import { getPets, getPetById, createPet, updatePet, deletePet } from '../api/petApi'
import { getOwners } from '../api/ownerApi'

const pets = ref([])
const owners = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加宠物')
const isEdit = ref(false)
const formRef = ref()

const form = ref({
  id: null,
  name: '',
  species: '',
  breed: '',
  age: 0,
  gender: 'unknown',
  color: '',
  weight: 0,
  owner_id: null,
  remarks: ''
})

const rules = {
  name: [{ required: true, message: '请输入宠物名字', trigger: 'blur' }],
  species: [{ required: true, message: '请选择品种', trigger: 'change' }],
  owner_id: [{ required: true, message: '请选择主人', trigger: 'change' }]
}

const loadPets = async () => {
  try {
    const res = await getPets()
    pets.value = res.data.data
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const loadOwners = async () => {
  try {
    const res = await getOwners()
    owners.value = res.data.data
  } catch (error) {
    ElMessage.error('加载主人失败')
  }
}

const showAddDialog = () => {
  dialogTitle.value = '添加宠物'
  isEdit.value = false
  form.value = { id: null, name: '', species: '', breed: '', age: 0, gender: 'unknown', color: '', weight: 0, owner_id: null, remarks: '' }
  dialogVisible.value = true
}

const showEditDialog = async (row) => {
  dialogTitle.value = '编辑宠物'
  isEdit.value = true
  try {
    const res = await getPetById(row.id)
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
          await updatePet(form.value.id, form.value)
          ElMessage.success('更新成功')
        } else {
          await createPet(form.value)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadPets()
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '操作失败')
      }
    }
  })
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该宠物吗？', '提示', { type: 'warning' })
    await deletePet(id)
    ElMessage.success('删除成功')
    loadPets()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadPets()
  loadOwners()
})
</script>

<style scoped>
.pet-list {
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
