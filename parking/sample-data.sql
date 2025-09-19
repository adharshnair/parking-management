-- Sample data for testing the Parking Management System

-- Insert sample parking lots
INSERT INTO public.parking_lots (id, name, address, city, state, postal_code, latitude, longitude, hourly_rate, amenities, operating_hours, status) VALUES
(uuid_generate_v4(), 'Downtown Plaza Parking', '123 Main Street', 'New York', 'NY', '10001', 40.7589, -73.9851, 15.00, ARRAY['security_cameras', 'covered_parking', 'ev_charging'], '{"open": "06:00", "close": "22:00"}', 'active'),
(uuid_generate_v4(), 'Mall Parking Complex', '456 Shopping Ave', 'Los Angeles', 'CA', '90210', 34.0522, -118.2437, 12.00, ARRAY['security_cameras', 'shopping_mall_access', 'restrooms'], '{"open": "08:00", "close": "23:00"}', 'active'),
(uuid_generate_v4(), 'Airport Parking Terminal', '789 Airport Blvd', 'Chicago', 'IL', '60601', 41.8781, -87.6298, 20.00, ARRAY['security_cameras', 'shuttle_service', 'covered_parking'], '{"open": "00:00", "close": "23:59"}', 'active'),
(uuid_generate_v4(), 'University Campus Parking', '321 College Dr', 'Boston', 'MA', '02101', 42.3601, -71.0589, 8.00, ARRAY['student_discount', 'security_cameras'], '{"open": "06:00", "close": "20:00"}', 'active'),
(uuid_generate_v4(), 'Business District Parking', '654 Corporate Way', 'San Francisco', 'CA', '94101', 37.7749, -122.4194, 18.00, ARRAY['security_cameras', 'ev_charging', 'valet_service'], '{"open": "07:00", "close": "19:00"}', 'active');

-- Get parking lot IDs for slot creation
-- Note: In practice, you would get these IDs from the actual inserted records
-- For this example, we'll use placeholder IDs

-- Insert sample parking slots (this would be done after getting actual parking lot IDs)
-- This is a template - you would run this after creating the parking lots

-- Example for adding slots to a parking lot:
-- INSERT INTO public.parking_slots (parking_lot_id, slot_number, slot_type, hourly_rate, floor_level, section) VALUES
-- ('parking_lot_id_1', 'A001', 'four_wheeler', 15.00, 1, 'A'),
-- ('parking_lot_id_1', 'A002', 'four_wheeler', 15.00, 1, 'A'),
-- ... and so on

-- Sample admin user (you would need to create this after auth user is created)
-- INSERT INTO public.profiles (id, email, full_name, role) VALUES
-- ('admin_user_id', 'admin@parkingsystem.com', 'System Administrator', 'admin');

-- Sample notification templates
INSERT INTO public.notifications (id, user_id, type, title, message, is_read) VALUES
(uuid_generate_v4(), null, 'general', 'Welcome to Parking System', 'Thank you for registering with our parking management system!', false),
(uuid_generate_v4(), null, 'general', 'System Maintenance', 'Scheduled maintenance will be performed tonight from 2:00 AM to 4:00 AM.', false);
