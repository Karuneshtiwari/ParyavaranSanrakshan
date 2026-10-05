# ParyavaranSanrakshan — Machine Learning Engineering Pipeline

This document provides complete mathematical, architectural, and procedural documentation for the three machine learning models developed and deployed in **ParyavaranSanrakshan**.

---

## Model 1: Waste Classification Model

### Objective
Accurately categorize solid waste items from photographic imagery into six standard streams: `cardboard`, `glass`, `metal`, `paper`, `plastic`, and `trash`.

### Architecture
- **Base Architecture**: MobileNetV3-Small (Pretrained on ImageNet-1k)
- **Transfer Learning Formulation**:
  - Feature extractor layers frozen up to the terminal convolutional blocks
  - Custom classification head: `Linear(in_features=576, out_features=6)`
- **Input Dimension**: $224 \times 224 \times 3$
- **Optimization**:
  - Loss Function: CrossEntropyLoss with softmax output
  - Optimizer: AdamW ($lr=0.001$, weight decay=$10^{-4}$)
  - Learning Rate Scheduler: `ReduceLROnPlateau(mode='max', factor=0.5, patience=2)`

### Data Augmentation Pipeline
1. `Resize((224, 224))`
2. `RandomHorizontalFlip(p=0.5)`
3. `RandomRotation(degrees=15)`
4. `ColorJitter(brightness=0.15, contrast=0.15)`
5. `ToTensor()`
6. `Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])`

### Real Evaluation Results (Test Set: 380 unseen images)
- **Accuracy**: $83.68\%$
- **Macro Precision**: $85.22\%$
- **Macro Recall**: $80.67\%$
- **Macro F1-Score**: $82.08\%$
- **Weighted F1-Score**: $83.89\%$

### Confusion Matrix (Test Set)
```
Actual \ Pred    cardboard  glass  metal  paper  plastic  trash
cardboard               55      1      0      1        3      1
glass                    0     62      1      0       12      0
metal                    0      7     50      0        5      0
paper                    3      1      2     74        8      1
plastic                  0      5      1      1       65      0
trash                    0      2      4      0        3     12
```

---

## Model 2: Smart Bin Fill Level Regressor

### Objective
Predict future fill level percentage at $+6$ hours and $+12$ hours forecast horizons using historical telemetry and temporal variables.

### Architecture
- **Algorithm**: Multi-Output `RandomForestRegressor` (100 estimators, max_depth=16, min_samples_split=4)
- **Feature Pipeline**:
  - One-Hot Encoding: `location`, `waste_type`
  - Pass-through: `fill_level`, `previous_fill_level`, `fill_change_rate`, `hour`, `day_of_week`, `is_weekend`, `hours_since_collection`, `temperature`

### Real Evaluation Results (Test Set: 3,840 time-series records)
- **6-Hour Horizon**:
  - $\text{MAE} = 6.256\%$
  - $\text{RMSE} = 13.424\%$
  - $R^2 = 0.7527$
- **12-Hour Horizon**:
  - $\text{MAE} = 9.972\%$
  - $\text{RMSE} = 19.060\%$
  - $R^2 = 0.5337$
- **Overall Aggregate**:
  - $\text{MAE} = 8.114\%$
  - $\text{RMSE} = 16.242\%$
  - $R^2 = 0.6432$

---

## Model 3: Smart Bin Overflow Risk Classifier

### Objective
Predict whether a virtual smart bin will exceed safe fill capacity or require emergency collection clearance (`LOW`, `MEDIUM`, or `HIGH`).

### Architecture
- **Algorithm**: `RandomForestClassifier` (100 estimators, max_depth=14, min_samples_split=4)
- **Features**: `fill_level`, `future_fill_6h`, `fill_change_rate`, `location`, `hour`, `day_of_week`, `hours_since_collection`, `waste_type`

### Real Evaluation Results (Test Set: 3,840 records)
- **Accuracy**: $99.79\%$
- **Macro Precision**: $99.74\%$
- **Macro Recall**: $99.85\%$
- **Macro F1-Score**: $99.80\%$

### Confusion Matrix
```
Actual \ Pred    LOW    MEDIUM    HIGH
LOW             1898         7       0
MEDIUM             0      1068       1
HIGH               0         0     866
```

---

## Transparent Decision-Support Priority Engine

To schedule sanitation clearance without black-box opacity, the platform computes a composite priority score:

$$\text{Priority Score} = 0.45 \cdot (\text{Current Fill \%}) + 0.35 \cdot (\text{Predicted 6h Fill \%}) + 0.20 \cdot (\text{Normalized Risk Score})$$

Where Normalized Risk Score:
- $\text{HIGH} = 100$
- $\text{MEDIUM} = 50$
- $\text{LOW} = 10$

Priority Classification:
- $\text{Score} \ge 75 \lor \text{Current Fill} \ge 85\% \implies \textbf{CRITICAL}$
- $\text{Score} \ge 55 \lor \text{Current Fill} \ge 70\% \implies \textbf{HIGH}$
- $\text{Score} \ge 35 \implies \textbf{MEDIUM}$
- $\text{Otherwise} \implies \textbf{LOW}$
