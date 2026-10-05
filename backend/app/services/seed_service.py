"""
Database Seed Service.
Seeds 20 virtual smart bins, demo role accounts (Admin, Collector, Citizen),
and initial predictions based on real ML models.
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.models.all_models import User, Bin, SensorReading, Prediction
from backend.app.services.auth_service import get_password_hash
from backend.app.services.prediction_service import predict_bin_telemetry

INITIAL_BINS = [
    {"bin_code": "BLR-001", "location_name": "Indiranagar 100ft Road Hub", "latitude": 12.9784, "longitude": 77.6408, "capacity": 120, "waste_type": "Mixed / General", "current_fill": 45.0, "status": "Normal"},
    {"bin_code": "BLR-002", "location_name": "Koramangala 5th Block Commercial", "latitude": 12.9352, "longitude": 77.6245, "capacity": 150, "waste_type": "Organic / Food", "current_fill": 86.0, "status": "Critical"},
    {"bin_code": "BLR-003", "location_name": "Whitefield ITPL Transit Zone", "latitude": 12.9856, "longitude": 77.7289, "capacity": 120, "waste_type": "Dry / Recyclable", "current_fill": 76.0, "status": "Warning"},
    {"bin_code": "BLR-004", "location_name": "HSR Layout Sector 1 Market", "latitude": 12.9116, "longitude": 77.6474, "capacity": 100, "waste_type": "Mixed / General", "current_fill": 58.0, "status": "Normal"},
    {"bin_code": "BLR-005", "location_name": "MG Road Metro Station Point", "latitude": 12.9756, "longitude": 77.6066, "capacity": 100, "waste_type": "Plastic / Beverage", "current_fill": 32.0, "status": "Normal"},
    {"bin_code": "BLR-006", "location_name": "Malleshwaram 8th Cross Civic Hub", "latitude": 13.0031, "longitude": 77.5701, "capacity": 110, "waste_type": "Dry / Paper", "current_fill": 64.0, "status": "Warning"},
    {"bin_code": "BLR-007", "location_name": "KR Market Wholesale Vegetable Terminal", "latitude": 12.9634, "longitude": 77.5765, "capacity": 180, "waste_type": "Organic / Wet", "current_fill": 89.0, "status": "Critical"},
    {"bin_code": "BLR-008", "location_name": "Jayanagar 4th Block Complex", "latitude": 12.9299, "longitude": 77.5838, "capacity": 120, "waste_type": "Mixed / Domestic", "current_fill": 38.0, "status": "Normal"},
    {"bin_code": "BLR-009", "location_name": "Electronic City Phase 1 Gate", "latitude": 12.8452, "longitude": 77.6602, "capacity": 140, "waste_type": "Packaging / Cardboard", "current_fill": 72.0, "status": "Warning"},
    {"bin_code": "BLR-010", "location_name": "Hebbal Flyover Bus Interchange", "latitude": 13.0358, "longitude": 77.5970, "capacity": 110, "waste_type": "Plastic / Bottles", "current_fill": 52.0, "status": "Normal"},
    {"bin_code": "BLR-011", "location_name": "BTM Layout 2nd Stage Ring Road", "latitude": 12.9166, "longitude": 77.6101, "capacity": 100, "waste_type": "Mixed / General", "current_fill": 42.0, "status": "Normal"},
    {"bin_code": "BLR-012", "location_name": "Marathahalli Bridge Transit", "latitude": 12.9591, "longitude": 77.6974, "capacity": 130, "waste_type": "Plastic / Beverage", "current_fill": 68.0, "status": "Warning"},
    {"bin_code": "BLR-013", "location_name": "Shivajinagar Central Terminus", "latitude": 12.9863, "longitude": 77.6033, "capacity": 120, "waste_type": "Organic / Food", "current_fill": 92.0, "status": "Critical"},
    {"bin_code": "BLR-014", "location_name": "Rajajinagar 1st Block Industrial", "latitude": 12.9912, "longitude": 77.5526, "capacity": 140, "waste_type": "Mixed / Dry", "current_fill": 28.0, "status": "Normal"},
    {"bin_code": "BLR-015", "location_name": "Bellandur Outer Ring Road Junction", "latitude": 12.9260, "longitude": 77.6762, "capacity": 130, "waste_type": "Packaging / Plastic", "current_fill": 81.0, "status": "Critical"},
    {"bin_code": "BLR-016", "location_name": "Banashankari 3rd Stage Bus Depot", "latitude": 12.9255, "longitude": 77.5468, "capacity": 100, "waste_type": "Mixed / General", "current_fill": 36.0, "status": "Normal"},
    {"bin_code": "BLR-017", "location_name": "Cubbon Park Green Zone Terminal", "latitude": 12.9763, "longitude": 77.5929, "capacity": 90,  "waste_type": "Dry / Biodegradable", "current_fill": 22.0, "status": "Normal"},
    {"bin_code": "BLR-018", "location_name": "Yeshwanthpur Railway Terminal Area", "latitude": 13.0238, "longitude": 77.5501, "capacity": 160, "waste_type": "Mixed / Plastic", "current_fill": 84.0, "status": "Critical"},
    {"bin_code": "BLR-019", "location_name": "Basavanagudi Gandhi Bazaar Market", "latitude": 12.9432, "longitude": 77.5739, "capacity": 120, "waste_type": "Organic / Flower Waste", "current_fill": 48.0, "status": "Normal"},
    {"bin_code": "BLR-020", "location_name": "Sarjapur Road Wipro Junction", "latitude": 12.9103, "longitude": 77.6850, "capacity": 130, "waste_type": "Mixed / Recyclable", "current_fill": 70.0, "status": "Warning"}
]


from backend.app.config import settings
from backend.app.models.all_models import User, Bin, SensorReading, Prediction, BlogPost, Event

def seed_database(db: Session):
    # 1. Seed Default Users
    demo_users = [
        {
            "name": settings.ADMIN_NAME,
            "email": settings.ADMIN_EMAIL,
            "password": settings.ADMIN_PASSWORD,
            "role": "ADMIN",
            "is_verified": True
        },
        {
            "name": "Karunesh Tiwari (Support)",
            "email": "info.karuneshtiwari@gmail.com",
            "password": settings.ADMIN_PASSWORD,
            "role": "ADMIN",
            "is_verified": True
        },
        {
            "name": "Waste Collector",
            "email": "collector@paryavaran.org",
            "password": "collector123",
            "role": "COLLECTOR",
            "is_verified": True
        },
        {
            "name": "Eco Citizen",
            "email": "citizen@paryavaran.org",
            "password": "citizen123",
            "role": "CITIZEN",
            "is_verified": True
        }
    ]

    for u in demo_users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            new_user = User(
                name=u["name"],
                email=u["email"],
                password_hash=get_password_hash(u["password"]),
                role=u["role"],
                is_verified=u["is_verified"]
            )
            db.add(new_user)
        else:
            # Ensure admin password matches updated spec if changed
            if u["email"] == settings.ADMIN_EMAIL:
                existing.password_hash = get_password_hash(u["password"])
                existing.is_verified = True
    db.commit()

    # 2. Seed Initial Featured Activities / Blogs
    if db.query(BlogPost).count() == 0:
        admin_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        admin_id = admin_user.id if admin_user else None

        initial_blogs = [
            {
                "title": "Community Cleanliness & Smart Bin Deployment Drive 2026",
                "title_hi": "सामुदायिक स्वच्छता एवं स्मार्ट बिन स्थापना अभियान २०२६",
                "summary": "Deployment of IoT-enabled and AI-monitored smart collection bins across key metropolitan hubs to prevent municipal overflows.",
                "summary_hi": "नगर निगम के अतिप्रवाह को रोकने के लिए प्रमुख महानगरीय केंद्रों में IoT और AI संचालित स्मार्ट डिब्बों की तैनाती।",
                "content": "ParyavaranSanrakshan has launched an expansive smart waste management initiative across municipal sectors. With real-time optical telemetrics, fill level monitoring, and predictive collection routing, urban waste collection efficiency has seen an immediate 40% enhancement.",
                "content_hi": "पर्यावरण संरक्षण ने नगर निगम क्षेत्रों में व्यापक स्मार्ट अपशिष्ट प्रबंधन पहल शुरू की है। वास्तविक समय की ऑप्टिकल टेलीमेट्रिक्स और संग्रह मार्गों की भविष्यवाणी के साथ, कचरा संग्रह क्षमता में उल्लेखनीय सुधार देखा गया है।",
                "category": "Deployment",
                "image_url": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
                "is_published": True
            },
            {
                "title": "Empowering Citizens: AI Segregation at the Source",
                "title_hi": "नागरिक सशक्तिकरण: स्रोत पर एआई अपशिष्ट पृथक्करण",
                "summary": "How MobileNetV3 deep learning assists millions of households to segregate dry, wet, and hazardous waste accurately with camera scan.",
                "summary_hi": "मोबाइलनेटवी3 डीप लर्निंग द्वारा घरेलू उपयोगकर्ताओं को कैमरे से स्कैन करके सूखा, गीला और पुनर्चक्रण योग्य कचरा सही ढंग से अलग करने में मदद।",
                "content": "Segregation at the source remains the foundational challenge in municipal solid waste cycles. By providing citizens with an instant camera-based classifier, ParyavaranSanrakshan eliminates contamination at community collection bins.",
                "content_hi": "स्रोत पर कचरा अलग करना ठोस अपशिष्ट प्रबंधन में सबसे बुनियादी चुनौती है। नागरिकों को तत्काल कैमरा-आधारित वर्गीकरण प्रदान करके, पर्यावरण संरक्षण रिसाइक्लिंग दक्षता को बढ़ावा देता है।",
                "category": "Awareness",
                "image_url": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
                "is_published": True
            },
            {
                "title": "Mission Life: Honoring Mother Earth Through Responsible Living",
                "title_hi": "मिशन लाइफ: जिम्मेदार जीवनशैली के माध्यम से धरती माता का सम्मान",
                "summary": "Embodying the timeless ancient philosophy: 'Caring for the earth, as one cares for a mother. || माता भूमि: पुत्रों अहम् पृथिव्या: ||'",
                "summary_hi": "प्राचीन कालातीत दर्शन को साकार करना: 'माता भूमि: पुत्रों अहम् पृथिव्या: — पृथ्वी हमारी माता है और हम इसके पुत्र हैं।'",
                "content": "Environmental conservation is not merely a modern regulatory obligation; it is a sacred cultural heritage. Through conscious consumption, zero-waste lifestyle, and intelligent recycling, we preserve nature for generations ahead.",
                "content_hi": "पर्यावरण संरक्षण केवल एक आधुनिक विनियामक दायित्व नहीं है, बल्कि एक पवित्र सांस्कृतिक धरोहर है। सचेत उपभोग और शून्य-अपशिष्ट जीवन शैली के माध्यम से हम प्रकृति का संरक्षण करते हैं।",
                "category": "Philosophy",
                "image_url": "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80",
                "is_published": True
            }
        ]

        for b in initial_blogs:
            blog_post = BlogPost(
                title=b["title"],
                title_hi=b["title_hi"],
                summary=b["summary"],
                summary_hi=b["summary_hi"],
                content=b["content"],
                content_hi=b["content_hi"],
                category=b["category"],
                image_url=b["image_url"],
                is_published=b["is_published"]
            )
            db.add(blog_post)
        db.commit()

    # 2. Seed / Update 20 Virtual Bins with Bengaluru Metropolitan Locations
    existing_bins_count = db.query(Bin).count()
    now = datetime.utcnow()
    if existing_bins_count == 0:
        for b_data in INITIAL_BINS:
            bin_obj = Bin(
                bin_code=b_data["bin_code"],
                location_name=b_data["location_name"],
                latitude=b_data["latitude"],
                longitude=b_data["longitude"],
                capacity=b_data["capacity"],
                waste_type=b_data["waste_type"],
                current_fill=b_data["current_fill"],
                status=b_data["status"],
                last_collection=now - timedelta(hours=random_hours(b_data["current_fill"]))
            )
            db.add(bin_obj)
            db.flush()

            # Add sensor reading
            reading = SensorReading(
                bin_id=bin_obj.id,
                timestamp=now,
                fill_level=bin_obj.current_fill,
                previous_fill_level=max(0.0, bin_obj.current_fill - 4.5),
                fill_change_rate=4.5,
                temperature=31.5,
                waste_type=bin_obj.waste_type
            )
            db.add(reading)

            # Generate real ML prediction
            pred_res = predict_bin_telemetry(
                current_fill=bin_obj.current_fill,
                previous_fill=reading.previous_fill_level,
                fill_change_rate=4.5,
                location=bin_obj.location_name,
                waste_type=bin_obj.waste_type,
                hour=now.hour,
                day_of_week=now.weekday(),
                hours_since_collection=4,
                temperature=31.5
            )

            prediction = Prediction(
                bin_id=bin_obj.id,
                prediction_time=now,
                predicted_6h=pred_res["predicted_6h"],
                predicted_12h=pred_res["predicted_12h"],
                overflow_probability=pred_res["overflow_probability"],
                risk_level=pred_res["risk_level"]
            )
            db.add(prediction)

            if pred_res["risk_level"] == "HIGH" or bin_obj.current_fill >= 80.0:
                bin_obj.status = "Critical"
            elif pred_res["risk_level"] == "MEDIUM" or bin_obj.current_fill >= 60.0:
                bin_obj.status = "Warning"
            else:
                bin_obj.status = "Normal"
        db.commit()
    else:
        # Update existing bins to Bengaluru names and coordinates if needed
        all_bins = db.query(Bin).order_by(Bin.id.asc()).all()
        for idx, b in enumerate(all_bins):
            if idx < len(INITIAL_BINS):
                blr_data = INITIAL_BINS[idx]
                b.bin_code = blr_data["bin_code"]
                b.location_name = blr_data["location_name"]
                b.latitude = blr_data["latitude"]
                b.longitude = blr_data["longitude"]
                b.waste_type = blr_data["waste_type"]
        db.commit()

    # 3. Seed Initial Citizen Events & Drives (Upcoming, Ongoing, Completed)
    if db.query(Event).count() == 0:
        sample_events = [
            {
                "title": "Bengaluru Mega Cleanliness & Smart Bin Drive",
                "title_hi": "बेंगलुरु महा स्वच्छता एवं स्मार्ट बिन अभियान",
                "description": "Join municipal volunteers and citizens for a community-wide segregation drive and live demo of smart bin overflow alert technology at Indiranagar 100ft road.",
                "description_hi": "इंदिरानगर में स्मार्ट बिन ओवरफ्लो अलर्ट तकनीक और कचरा पृथक्करण अभियान में भाग लें।",
                "category": "Cleanliness Drive",
                "status": "ongoing",
                "event_date": now + timedelta(days=2),
                "end_date": now + timedelta(days=2, hours=4),
                "location": "Indiranagar Metro Hub, Bengaluru",
                "image_url": "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80",
                "max_participants": 120
            },
            {
                "title": "AI Waste Classification & Source Segregation Workshop",
                "title_hi": "एआई कचरा पृथक्करण कार्यशाला",
                "description": "Interactive hands-on session demonstrating how citizens can use mobile cameras and Computer Vision to eliminate dry and wet waste contamination.",
                "description_hi": "नागरिकों के लिए मोबाइल कैमरा और कंप्यूटर विज़न द्वारा कचरा पृथक्करण पर व्यावहारिक कार्यशाला।",
                "category": "Workshop",
                "status": "upcoming",
                "event_date": now + timedelta(days=6),
                "end_date": now + timedelta(days=6, hours=3),
                "location": "Koramangala Community Hall, Bengaluru",
                "image_url": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
                "max_participants": 80
            },
            {
                "title": "Cubbon Park Citizen Eco-Audit & Sapling Drive",
                "title_hi": "कब्बन पार्क नागरिक पर्यावरण ऑडिट एवं पौधरोपण",
                "description": "Annual civic environmental audit assessing plastic consumption and deploying 5 new IoT solar-assisted bins across Cubbon Park.",
                "description_hi": "कब्बन पार्क में प्लास्टिक खपत का ऑडिट और नए आईओटी स्मार्ट डिब्बों की स्थापना।",
                "category": "Audit & Plantation",
                "status": "upcoming",
                "event_date": now + timedelta(days=12),
                "end_date": now + timedelta(days=12, hours=5),
                "location": "Cubbon Park Green Promenade, Bengaluru",
                "image_url": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
                "max_participants": 200
            },
            {
                "title": "Whitefield Electronic Waste & Dry Recyclables Collection",
                "title_hi": "व्हाइटफील्ड ई-कचरा एवं सूखा पुनर्चक्रण संग्रह",
                "description": "Successfully completed municipal collection drive diverting 3.4 tonnes of electronic and packaging waste into certified recycling streams.",
                "description_hi": "सफलतापूर्वक संपन्न नगर निगम संग्रह अभियान जिसमें ३.४ टन ई-कचरे का पुनर्चक्रण किया गया।",
                "category": "Recycling Drive",
                "status": "completed",
                "event_date": now - timedelta(days=14),
                "end_date": now - timedelta(days=14, hours=6),
                "location": "ITPL Main Gate, Whitefield, Bengaluru",
                "image_url": "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80",
                "max_participants": 150
            }
        ]

        for ev in sample_events:
            event_obj = Event(
                title=ev["title"],
                title_hi=ev["title_hi"],
                description=ev["description"],
                description_hi=ev["description_hi"],
                event_type=ev.get("category", "Awareness"),
                status=ev["status"],
                event_date=ev["event_date"],
                location=ev["location"],
                image_url=ev["image_url"],
                max_capacity=ev.get("max_participants", 100),
                current_registered=0
            )
            db.add(event_obj)
        db.commit()
        print("[SUCCESS] Seeded initial events and updated Bengaluru bins.")


def random_hours(fill: float) -> int:
    if fill > 80:
        return 7
    elif fill > 50:
        return 4
    return 2
