async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        const products = await res.json();
        const grid = document.getElementById('product-list');
        if (!products.length) {
            grid.innerHTML = '<p>No products found.</p>';
            return;
        }
        grid.innerHTML = products.slice(0, 8).map(p => `
            <div class="product-card">
                <img src="${p.img || '/images/placeholder.jpg'}" alt="${p.title}" onerror="this.src='/images/placeholder.jpg'">
                <div class="info">
                    <h3>${p.title}</h3>
                    <p class="price">৳${p.price}</p>
                </div>
            </div>
        `).join('');
    } catch(e) {
        document.getElementById('product-list').innerHTML = '<p>Failed to load products.</p>';
    }
}
document.addEventListener('DOMContentLoaded', loadProducts);
