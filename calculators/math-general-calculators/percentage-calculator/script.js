.calculator-container {
  max-width: 360px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #f9f9f9;
  box-sizing: border-box;
  margin: 0 auto;
}

.calculator-container h2 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 18px;
}

/* Generic input groups (both .form-group and .input-group) */
.form-group,
.input-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.form-group label,
.input-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
}

.form-group input[type="text"],
.input-group input[type="text"] {
  width: 100%;
  padding: 6px 8px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #bbb;
  box-sizing: border-box;
}

.form-group input[type="text"]:focus,
.input-group input[type="text"]:focus {
  outline: none;
  border-color: #0077cc;
  box-shadow: 0 0 0 1px rgba(0, 119, 204, 0.15);
}

#calculateButton {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

#result {
  margin-top: 14px;
  padding: 10px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  font-size: 14px;
}

#result.error {
  color: #b00020;
  font-weight: 600;
}

#result.success {
  color: #0b4f2a;
}

.share-buttons {
  margin-top: 12px;
}

.share-buttons button {
  width: 100%;
  padding: 9px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #007f3b;
  background-color: #00a651;
  color: #ffffff;
  cursor: pointer;
}

/* Related category tiles */
.related-card {
  display: block;
  text-decoration: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  background: #ffffff;
  box-sizing: border-box;
  height: 100%;
}

.related-title {
  font-weight: bold;
  margin: 0 0 4px;
  font-size: 14px;
}

.related-desc {
  font-size: 13px;
  color: #555555;
  margin: 0;
}

/* SEO section */
.seo-section {
  font-size: 14px;
  line-height: 1.6;
}

.seo-section h2 {
  margin-top: 0;
  font-size: 18px;
}

.seo-section h3 {
  font-size: 15px;
  margin-top: 14px;
  margin-bottom: 6px;
}

.seo-section p {
  margin-bottom: 8px;
}

.seo-section ul {
  padding-left: 18px;
  margin-bottom: 10px;
}

.last-updated {
  margin-top: 12px;
  font-size: 12px;
  color: #777777;
}

/* Ad and affiliate placeholders – shared look */
.ad-block {
  border-radius: 8px;
  border: 1px dashed #d0d0d0;
  padding: 8px;
  box-sizing: border-box;
}

.ad-placeholder-img {
  width: 100%;
  height: 80px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: repeating-linear-gradient(
    45deg,
    #f5f5f5,
    #f5f5f5 6px,
    #e9e9e9 6px,
    #e9e9e9 12px
  );
}

/* Breadcrumbs – force same look everywhere */
.breadcrumbs {
  font-size: 13px;
  margin-bottom: 10px;
}

.breadcrumbs a {
  text-decoration: none;
}

/* Basic mobile tweak */
@media (max-width: 768px) {
  .calculator-container {
    max-width: 100%;
  }
}

/* Calculator-specific styling */

.calculator-intro {
  font-size: 13px;
  margin-bottom: 12px;
  color: #444444;
}

.calculator-form {
  margin-top: 6px;
}

.calculator-mode-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.mode-option input[type="radio"] {
  margin: 0;
}

#calculateButton {
  background-color: #0077cc;
  color: #ffffff;
}

#calculateButton:hover {
  opacity: 0.95;
}

.share-buttons button:hover {
  opacity: 0.95;
}
