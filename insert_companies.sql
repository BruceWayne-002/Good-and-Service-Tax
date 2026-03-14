-- Insert users into the companies table with their GSTIN
INSERT INTO companies (gstin,email,trade_name,role) VALUES 
 ('33AANFT5230C1ZH','tamizhaneps123@gmail.com','TAMIZHAN ENTERPRISES','user'), 
 ('33AMPPR7163N1Z8','nrakeshm123@gmail.com','RAKESH KUMAR N','user'), 
 ('33BDDPT4799J1ZW','amudhasurabhi1234@gmail.com','AMUDHASURABHI RICE TRADERS','user'), 
 ('33AAFCH6368A1ZU','hannijitradings123@gmail.com','HANNIJI ECO POLYMERS PRIVATE LIMITED','user'), 
 ('33ABCCS8325A1ZR','syncdigit123@gmail.com','SYNCDIGIT SOLUTIONS PRIVATE LIMITED','user'), 
 ('33AASFV7843A1ZZ','vihaancons123@gmail.com','VIHAAN CONSTRUCTIONS','user'), 
 ('33ATUPP1297M1ZU','periasamycivilt123@gmail.com','S.PERIASAMY CONTRACTOR','user'), 
 ('33GDQPP4430Q1ZS','sashtinyra123@gmail.com','NYRA LABEL','user'), 
 ('33JOFPS5246A1ZZ','jofps524a123@gmail.com','ARITHABI AND CO','user') 
 ON CONFLICT (email) DO NOTHING; 

 -- Add admin user
 INSERT INTO companies (gstin,email,trade_name,role) 
 VALUES ('33FKCPS0842D1ZG','ismsexports@gmail.com','SMS EXPORTS','admin') 
 ON CONFLICT (email) DO NOTHING; 

 -- Verify the insertion
 SELECT email, role 
 FROM companies;
