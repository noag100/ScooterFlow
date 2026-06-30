-- 1. מחיקת נתונים קיימים
DELETE FROM TASKS;
DELETE FROM SCOOTERS;
DELETE FROM WORKERS;

-- 2. הכנסת צי קורקינטים
INSERT INTO SCOOTERS (BATTERY_LEVEL, LATITUDE, LONGITUDE, STATUS, LAST_USED) VALUES
                                                                                 (98, 32.0853, 34.7818, 'AVAILABLE', CURRENT_TIMESTAMP),
                                                                                 (12, 32.0780, 34.7740, 'AVAILABLE', CURRENT_TIMESTAMP),
                                                                                 (100, 32.0800, 34.7850, 'AVAILABLE', CURRENT_TIMESTAMP),
                                                                                 (45, 32.0900, 34.7900, 'AVAILABLE', CURRENT_TIMESTAMP),
                                                                                 (5, 32.0700, 34.7600, 'AVAILABLE', CURRENT_TIMESTAMP),
                                                                                 (85, 32.0620, 34.7700, 'IN_USE', CURRENT_TIMESTAMP),
                                                                                 (30, 32.0550, 34.7500, 'AVAILABLE', CURRENT_TIMESTAMP),
                                                                                 (0, 32.1000, 34.8000, 'IN_REPAIR', CURRENT_TIMESTAMP),
                                                                                 (60, 32.0450, 34.7550, 'AVAILABLE', CURRENT_TIMESTAMP),
                                                                                 (18, 32.0730, 34.7900, 'AVAILABLE', CURRENT_TIMESTAMP);

-- 3. הכנסת עובדים (תיקון ROLE!)
INSERT INTO WORKERS (NAME, USERNAME, PASSWORD, ROLE, IS_AVAILABLE) VALUES
                                                                       ('דני המנהל', 'admin', '12345678', 'ADMIN', true),
                                                                       ('אבי לוגיסטיקה', 'avi', '12345678', 'LOGISTICS', true),
                                                                       ('יוסי טעינות', 'yossi', '12345678', 'CHARGER', true),
                                                                       ('מיכל טעינות', 'michal', '12345678', 'CHARGER', true),
                                                                       ('רוני טכנאי', 'roni', '12345678', 'TECHNICIAN', true),
                                                                       ('אורי טכנאי', 'uri', '12345678', 'TECHNICIAN', true);
-- 4. הכנסת משימת תיקון (תיקון LIMIT ל-H2)
INSERT INTO TASKS (SCOOTER_ID, TYPE, STATUS, URGENCY, CREATED_AT)
SELECT id, 'REPAIR', 'OPEN', 3, CURRENT_TIMESTAMP
FROM SCOOTERS
WHERE STATUS = 'IN_REPAIR'
    FETCH FIRST 1 ROWS ONLY;