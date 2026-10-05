# ParyavaranSanrakshan — Engineering & Academic Limitations

This project is an **academic internship research prototype** designed to demonstrate the feasibility of combining computer vision and predictive machine learning for urban solid waste management. It is not an operational municipal utility.

---

## Documented Constraints

1. **Controlled Photographic Training Conditions (TrashNet)**
   - The TrashNet dataset images were captured on clean, solid-white or consistent background surfaces under controlled illumination.
   - Classification precision may experience degradation when evaluating heavily crumpled, obscured, or mixed outdoor litter in uncontrolled conditions.

2. **Synthetic Telemetry Simulation**
   - The 20 virtual smart bins and 19,200 telemetry records are generated using domain-specific time-series mathematical simulations with controlled Poisson noise.
   - The platform does not claim to stream data from physical ultrasonic IoT hardware deployed in Indian municipalities.

3. **Configurable Categorization Guidelines**
   - Segregation mappings (e.g. Cardboard & Plastic into Dry/Blue bin, Trash into Reject/Black bin) represent prototype conventions.
   - Local municipal rules across different Indian states and cities vary and can be configured through `backend/app/config.py`.

4. **Prototype Algorithmic Collection Priority**
   - The collection priority formula ($0.45 \cdot \text{Fill} + 0.35 \cdot \text{Pred}_{6h} + 0.20 \cdot \text{Risk}$) serves as a transparent decision-support mechanism for academic demonstration, not an officially certified municipal dispatch protocol.

5. **Scope Boundaries**
   - The platform does not guarantee live vehicular GPS tracking or automated route barrier navigation.
