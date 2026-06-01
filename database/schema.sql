-- 宠物店管理系统数据库schema
CREATE DATABASE IF NOT EXISTS pet_shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pet_shop_db;

-- 主人表
CREATE TABLE owners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='宠物主人信息表';

-- 宠物表
CREATE TABLE pets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age INT,
    gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown',
    color VARCHAR(50),
    weight DECIMAL(5,2),
    owner_id INT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    INDEX idx_owner_id (owner_id),
    INDEX idx_species (species)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='宠物信息表';

-- 商品分类表
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- 商品表
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id INT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    description TEXT,
    image_url VARCHAR(500),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_category_id (category_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品信息表';

-- 订单表
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单信息表';

-- 订单商品明细表
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品明细表';

-- 插入测试数据
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
