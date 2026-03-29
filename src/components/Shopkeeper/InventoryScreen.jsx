import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    FlatList,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { Dropdown } from 'react-native-element-dropdown';
import keyChain from 'react-native-keychain';
import axios from 'axios';
import Config from 'react-native-config';
import { set } from 'pm2';
const unitOptions = [
    { label: 'kg', value: 'kg' },
    { label: 'gram', value: 'gram' },
    { label: 'liter', value: 'liter' },
    { label: 'ml', value: 'ml' },
    { label: 'piece', value: 'piece' },
    { label: 'pack', value: 'pack' },
];

const InventoryScreen = ({ navigation }) => {
    // Loading state
    const [isLoading, setIsLoading] = useState(true);

    // Sample product data matching MongoDB schema
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        (async () => {
            try {
                setIsLoading(true);
                let res = await keyChain.getGenericPassword()
                let token = JSON.parse(res.password).token
                let result = await axios.post(`${Config.API_URL}/getproducts`, { token })
                if (result.data.success == false) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: result.data.message || 'Failed to fetch products'
                    })

                    setProducts([]);
                } else {
                    console.log(result.data.products);

                    setProducts(result.data.products || [])
                }
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: error.message || 'Failed to fetch products'
                })
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        })()
    }, [])

    // Product Modal State
    const [isProductModalVisible, setIsProductModalVisible] = useState(false);
    const [productName, setProductName] = useState('');
    const [editingProductId, setEditingProductId] = useState(null);

    // Initial Variant (for new product)
    const [initialQuantity, setInitialQuantity] = useState('');
    const [initialUnit, setInitialUnit] = useState('kg');
    const [initialPrice, setInitialPrice] = useState('');

    // Variant Modal State
    const [isVariantModalVisible, setIsVariantModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [variantQuantity, setVariantQuantity] = useState('');
    const [variantUnit, setVariantUnit] = useState('kg');
    const [variantPrice, setVariantPrice] = useState('');
    const [editingVariantId, setEditingVariantId] = useState(null);
    const [shopkeeperId, setShopkeeperId] = useState(null);

    const filteredProducts = products.filter((product) =>
        product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Reset Forms
    const resetProductForm = () => {
        setProductName('');
        setEditingProductId(null);
        setInitialQuantity('');
        setInitialUnit('kg');
        setInitialPrice('');
    };

    const resetVariantForm = () => {
        setVariantQuantity('');
        setVariantUnit('kg');
        setVariantPrice('');
        setEditingVariantId(null);
    };

    // Product Handlers
    const openAddProductModal = () => {
        resetProductForm();
        setIsProductModalVisible(true);
    };

    const openEditProductModal = (product) => {
        setProductName(product.name);
        setEditingProductId(product._id);
        setIsProductModalVisible(true);
    };

    const handleSaveProduct = async () => {

        console.log("i am here");

        if (!productName.trim()) {
            Toast.show({ type: 'error', text1: 'Please enter product name' });
            return;
        }

        if (editingProductId) {
            // API Call would be here: PUT/POST /updateinventory with role='edit_product'
            let pass = await keyChain.getGenericPassword()
            let token = JSON.parse(pass.password).token
            console.log("Editing product:", token, editingProductId, productName);
            let res = await axios.post(`${Config.API_URL}/editproductname`, { token, product_id: editingProductId, newname: productName });

            if (res.success == false) {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: res.data.message || "Server error"
                })
                return
            }

            setProducts(res.data.products || []);
            Toast.show({
                type: "success",
                text1: "Product Updated",
                text2: "Product name updated successfully"
            })

        } else {
            // Validate initial variant fields for new product
            if (!initialQuantity.trim() || !initialPrice.trim()) {
                Toast.show({
                    type: 'error',
                    text1: 'Please fill all variant fields',
                });
                return;
            }

            // API Call  would be here: POST /updateinventory with role='add_product' + variant data

            console.log('====================================');
            let res = await keyChain.getGenericPassword()
            let token = (JSON.parse(res.password).token);
            console.log(token, productName, initialQuantity, initialUnit, initialPrice);
            console.log('====================================');

            let result = await axios.post(`${Config.API_URL}/addproduct`, {
                name: productName,
                quantity: initialQuantity,
                unit: initialUnit,
                price: initialPrice,
                token: token
            })

            console.log('====================================');
            console.log(result);
            console.log('====================================');

            if (result.data.success == false) {

                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.data.message || 'Failed to add product'
                });
            }

            if (result.data.success == true) {
                console.log("came from backend:", result.data.products);
                setProducts(result.data.products);
            }

        }

        resetProductForm();
        setIsProductModalVisible(false);
    };

    const handleDeleteProduct = (product) => {
        console.log('====================================');
        console.log(product);
        console.log('====================================');

        Alert.alert(
            'Delete Product',
            `Are you sure you want to delete "${product.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // API Call would be here: POST /updateinventory with role='delete_product'
                        let result = await keyChain.getGenericPassword()
                        let token = JSON.parse(result.password).token
                        let res = await axios.post(`${Config.API_URL}/deleteproduct`, {
                            product_id: product._id,
                            token
                        })

                        if (res.data.success == false) {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: res.data.message || 'Failed to delete product'
                            })
                        }

                        if (res.data.success == true) {
                            Toast.show({
                                type: 'success',
                                text1: 'Success',
                                text2: res.data.message || 'Product deleted successfully'
                            })
                            console.log(res.data.products);
                            setProducts(res.data.products);
                        }

                        // setProducts(prev => prev.filter(p => p._id !== product._id));
                    },
                },
            ]
        );
    };

    // Variant Handlers
    const openAddVariantModal = (product) => {
        setSelectedProduct(product);
        resetVariantForm();
        setIsVariantModalVisible(true);
    };

    const openEditVariantModal = (product, variant) => {
        setSelectedProduct(product);
        setVariantQuantity(String(variant.quantity));
        setVariantUnit(variant.unit);
        setVariantPrice(String(variant.price));
        setEditingVariantId(variant._id);
        setIsVariantModalVisible(true);
    };

    const handleSaveVariant = async () => {
        if (!variantQuantity.trim() || !variantPrice.trim()) {
            Toast.show({ type: 'error', text1: 'Please fill all fields' });
            return;
        }

        if (editingVariantId) {
            // API Call would be here: POST /updateinventory with role='edit_variant'
            console.log(variantPrice, variantQuantity, variantUnit, editingVariantId, selectedProduct._id);
            let pass = await keyChain.getGenericPassword()
            let token = JSON.parse(pass.password).token
            let res = await axios.post(`${Config.API_URL}/editvariant`, { product_id: selectedProduct._id, variant_id: editingVariantId, quantity: variantQuantity, unit: variantUnit, price: variantPrice, token })

            if (res.data.success == false) {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: res.data.message || "Failed to edit variant"
                })
            }

            if (res.data.success == true) {
                setProducts(res.data.products)
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: res.data.message || "Variant updated successfully"
                })
            }


        } else {
            console.log(variantPrice, variantQuantity, variantUnit, selectedProduct);
            let pass = await keyChain.getGenericPassword()
            let token = JSON.parse(pass.password).token
            let res = await axios.post(`${Config.API_URL}/addvariant`, { product_id: selectedProduct._id, quantity: variantQuantity, unit: variantUnit, price: variantPrice, token })

            if (res.data.success == false) {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: res.data.message || "Failed to add variant"
                })
            }

            if (res.data.success == true) {

                setProducts(res.data.products)

                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: res.data.message
                })
            }
        }

        resetVariantForm();
        setIsVariantModalVisible(false);
    };

    const handleDeleteVariant = async (product, variant) => {
        console.log("deleting variant", product, variant);

        let pass = await keyChain.getGenericPassword()

        let token = JSON.parse(pass.password).token

        let res = await axios.post(`${Config.API_URL}/deletevariant`, { product_id: product._id, variant_id: variant._id, token })
        if (res.data.success == false) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: res.data.message || "Failed to delete variant"
            })
        }

        if (res.data.success == true) {
            setProducts(res.data.products)
            Toast.show({
                type: "success",
                text1: "Success",
                text2: res.data.message || "Variant deleted successfully"
            })
        }
    };

    // Render Functions
    const renderVariantItem = (variant, product) => (
        <View key={variant._id} style={styles.variantItem}>
            <View style={styles.variantInfo}>
                <Text style={styles.variantText}>
                    {variant.quantity} {variant.unit}
                </Text>
                <Text style={styles.variantPrice}>₹{variant.price}</Text>
            </View>
            <View style={styles.variantActions}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => openEditVariantModal(product, variant)}
                >
                    <Icon name="pencil" size={16} color="#2f6d1a" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDeleteVariant(product, variant)}
                >
                    <Icon name="delete" size={16} color="#dc2626" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderProductItem = ({ item: product }) => (
        <View style={styles.productCard}>
            <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.variantCount}>
                        {product.variants?.length || 0} variant
                        {(product.variants?.length || 0) !== 1 ? 's' : ''}
                    </Text>
                </View>
                <View style={styles.productActions}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => openEditProductModal(product)}
                    >
                        <Icon name="pencil" size={18} color="#2f6d1a" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDeleteProduct(product)}
                    >
                        <Icon name="delete" size={18} color="#dc2626" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.variantsContainer}>
                {product.variants && product.variants.length > 0 ? (
                    product.variants.map(variant => renderVariantItem(variant, product))
                ) : (
                    <Text style={styles.noVariantsText}>No variants added</Text>
                )}
            </View>

            <TouchableOpacity
                style={styles.addVariantButton}
                onPress={() => openAddVariantModal(product)}
            >
                <Icon name="plus" size={16} color="#2f6d1a" />
                <Text style={styles.addVariantText}>Add Variant</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Inventory</Text>
                <TouchableOpacity style={styles.addButton} onPress={openAddProductModal} disabled={isLoading}>
                    <Icon name="plus" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Add Product</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Icon name="magnify" size={20} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search product by name"
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    editable={!isLoading}
                />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2f6d1a" />
                    <Text style={styles.loadingText}>Loading products...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderProductItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Icon name="basket-outline" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>No products yet</Text>
                            <Text style={styles.emptySubText}>
                                Add your first product to get started
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Product Modal */}
            <Modal
                visible={isProductModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsProductModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingProductId ? 'Edit Product' : 'Add Product'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsProductModalVisible(false)}
                            >
                                <Icon name="close" size={24} color="#1c2b1f" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.formContent}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Product Name *</Text>
                                <View style={styles.inputWrapper}>
                                    <Icon name="package" size={18} color="#2f6d1a" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter product name"
                                        value={productName}
                                        onChangeText={setProductName}
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>

                            {/* Show initial variant fields only when adding new product */}
                            {!editingProductId && (
                                <>
                                    <Text style={styles.sectionTitle}>Initial Variant</Text>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Quantity *</Text>
                                        <View style={styles.inputWrapper}>
                                            <Icon name="numeric" size={18} color="#2f6d1a" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter quantity"
                                                value={initialQuantity}
                                                onChangeText={setInitialQuantity}
                                                keyboardType="decimal-pad"
                                                placeholderTextColor="#9ca3af"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Unit *</Text>
                                        <Dropdown
                                            style={styles.dropdown}
                                            containerStyle={styles.dropdownContainer}
                                            data={unitOptions}
                                            labelField="label"
                                            valueField="value"
                                            value={initialUnit}
                                            onChange={item => setInitialUnit(item.value)}
                                            placeholder="Select unit"
                                            maxHeight={200}
                                            dropdownPosition="auto"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Price *</Text>
                                        <View style={styles.inputWrapper}>
                                            <Icon name="currency-inr" size={18} color="#2f6d1a" />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter price"
                                                value={initialPrice}
                                                onChangeText={setInitialPrice}
                                                keyboardType="decimal-pad"
                                                placeholderTextColor="#9ca3af"
                                            />
                                        </View>
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setIsProductModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveProduct}
                            >
                                <Text style={styles.saveButtonText}>Save Product</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Variant Modal */}
            <Modal
                visible={isVariantModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsVariantModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingVariantId ? 'Edit Variant' : 'Add Variant'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsVariantModalVisible(false)}
                            >
                                <Icon name="close" size={24} color="#1c2b1f" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.formContent}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Quantity *</Text>
                                <View style={styles.inputWrapper}>
                                    <Icon name="numeric" size={18} color="#2f6d1a" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter quantity"
                                        value={variantQuantity}
                                        onChangeText={setVariantQuantity}
                                        keyboardType="decimal-pad"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Unit *</Text>
                                <Dropdown
                                    style={styles.dropdown}
                                    containerStyle={styles.dropdownContainer}
                                    data={unitOptions}
                                    labelField="label"
                                    valueField="value"
                                    value={variantUnit}
                                    onChange={item => setVariantUnit(item.value)}
                                    placeholder="Select unit"
                                    maxHeight={200}
                                    dropdownPosition="auto"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Price *</Text>
                                <View style={styles.inputWrapper}>
                                    <Icon name="currency-inr" size={18} color="#2f6d1a" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter price"
                                        value={variantPrice}
                                        onChangeText={setVariantPrice}
                                        keyboardType="decimal-pad"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setIsVariantModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveVariant}
                            >
                                <Text style={styles.saveButtonText}>Save Variant</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default InventoryScreen;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fafafa',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1c2b1f',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#2f6d1a',
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    searchContainer: {
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 11,
        fontSize: 14,
        color: '#1c2b1f',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    productCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1c2b1f',
        marginBottom: 4,
    },
    variantCount: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    productActions: {
        flexDirection: 'row',
        gap: 8,
    },
    variantsContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 8,
        marginBottom: 12,
    },
    variantItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    variantInfo: {
        flex: 1,
    },
    variantText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    variantPrice: {
        fontSize: 13,
        color: '#2f6d1a',
        fontWeight: '600',
        marginTop: 2,
    },
    variantActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noVariantsText: {
        fontSize: 13,
        color: '#9ca3af',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 8,
    },
    addVariantButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#2f6d1a',
        borderRadius: 8,
        gap: 6,
    },
    addVariantText: {
        fontSize: 13,
        color: '#2f6d1a',
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginTop: 12,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 6,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
        paddingBottom: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1c2b1f',
    },
    formContent: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginTop: 8,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f9fafb',
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        fontSize: 14,
        color: '#1c2b1f',
    },
    dropdown: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#f9fafb',
    },
    dropdownContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        marginTop: 4,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#f9fafb',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#2f6d1a',
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
