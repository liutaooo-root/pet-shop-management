-- 宠物店管理系统 - PostgreSQL Schema (Supabase)
-- 基于实际 orderController.js 中的字段设计

-- 自定义枚举类型
CREATE TYPE pet_gender AS ENUM ('male', 'female', 'unknown');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'completed', 'cancelled');
CREATE TYPE product_status AS ENUM ('active', 'inactive');

-- 主人表
CREATE TABLE owners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_owners_phone ON owners(phone);

-- 宠物表
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age INT,
    gender pet_gender DEFAULT 'unknown',
    color VARCHAR(50),
    weight DECIMAL(5,2),
    owner_id INT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pets_owner_id ON pets(owner_id);
CREATE INDEX idx_pets_species ON pets(species);

-- 商品分类表
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_categories_name ON categories(name);

-- 商品表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    description TEXT,
    image_url VARCHAR(500),
    status product_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);

-- 订单表（关键：用 owner_id + payment_method）
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL,
    owner_id INT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    status order_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_owner_id ON orders(owner_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 订单商品明细表
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 测试数据
INSERT INTO owners (name, phone, email, address) VALUES
('张三', '13800138000', 'zhangsan@example.com', '北京市朝阳区'),
('李四', '13900139000', 'lisi@example.com', '上海市浦东新区'),
('王五', '13700137000', 'wangwu@example.com', '广州市天河区');

INSERT INTO categories (name, description) VALUES
('狗粮', '各类狗粮产品'),
('猫粮', '各类猫粮产品'),
('宠物玩具', '宠物玩具和用品'),
('宠物保健品', '宠物营养品和保健品');

INSERT INTO products (name, category_id, price, stock, description) VALUES
('皇家大型犬粮10kg', 1, 299.00, 50, '适合大型犬的均衡营养狗粮'),
('希尔斯猫粮5kg', 2, 199.00, 30, '优质猫粮，呵护猫咪健康'),
('狗狗磨牙玩具', 3, 39.00, 100, '安全耐咬的狗狗玩具'),
('猫咪营养膏', 4, 89.00, 80, '补充猫咪日常所需营养');

INSERT INTO pets (name, species, breed, age, gender, color, weight, owner_id, remarks) VALUES
('小白', '狗', '金毛', 3, 'male', '金色', 28.5, 1, '温顺可爱'),
('小黑', '狗', '拉布拉多', 2, 'male', '黑色', 25.0, 1, '活泼好动'),
('咪咪', '猫', '英短', 1, 'female', '灰色', 4.2, 2, '喜欢睡觉'),
('橘橘', '猫', '橘猫', 2, 'male', '橘色', 5.8, 3, '贪吃'),
('旺财', '狗', '柯基', 1, 'male', '黄白', 12.3, 2, '短腿可爱');