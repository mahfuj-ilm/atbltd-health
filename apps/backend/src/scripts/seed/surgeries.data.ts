export interface SurgerySeedData {
  nameEn: string;
  nameBn: string;
  category: string;
}

export const SURGERIES_DATA: SurgerySeedData[] = [
  { nameEn: 'Dengue Fever', nameBn: 'ডেঙ্গু জ্বর', category: 'General Medicine' },
  { nameEn: 'Chikungunya', nameBn: 'চিকুনগুনিয়া', category: 'General Medicine' },
  { nameEn: 'Pneumonia', nameBn: 'নিউমোনিয়া', category: 'Respiratory' },
  { nameEn: 'Typhoid', nameBn: 'টাইফয়েড', category: 'General Medicine' },
  { nameEn: 'Severe Diarrhea', nameBn: 'ডায়রিয়া (গুরুতর)', category: 'General Medicine' },
  { nameEn: 'Cholera', nameBn: 'কলেরা', category: 'General Medicine' },
  { nameEn: 'Malaria', nameBn: 'ম্যালেরিয়া', category: 'General Medicine' },
  { nameEn: 'Jaundice', nameBn: 'জন্ডিস', category: 'General Medicine' },
  { nameEn: 'Kidney-related Complications', nameBn: 'কিডনি সংক্রান্ত জটিলতা', category: 'Urology' },
  { nameEn: 'Liver Disease', nameBn: 'লিভারের রোগ', category: 'Gastroenterology' },
  { nameEn: 'Respiratory Disease', nameBn: 'শ্বাসকষ্টজনিত রোগ', category: 'Respiratory' },
  { nameEn: 'Asthma Complications', nameBn: 'হাঁপানি (Asthma) জটিলতা', category: 'Respiratory' },
  {
    nameEn: 'Diabetes-related Complications',
    nameBn: 'ডায়াবেটিসজনিত জটিলতা',
    category: 'Endocrinology',
  },
  {
    nameEn: 'High Blood Pressure Complications',
    nameBn: 'উচ্চ রক্তচাপজনিত জটিলতা',
    category: 'Cardiology',
  },
  { nameEn: 'Stroke', nameBn: 'স্ট্রোক', category: 'Neurology' },
  { nameEn: 'Heart Attack', nameBn: 'হার্ট অ্যাটাক', category: 'Cardiology' },
  { nameEn: 'ICU Admission', nameBn: 'ICU-তে ভর্তি রোগী', category: 'Emergency' },
  { nameEn: 'Road Accident Injuries', nameBn: 'সড়ক দুর্ঘটনাজনিত আহত', category: 'Emergency' },
  { nameEn: 'Burn Injuries', nameBn: 'আগুনে দগ্ধ রোগী', category: 'Emergency' },
  { nameEn: 'Snake Bite & Rabies', nameBn: 'সাপে কাটা ও জলাতঙ্ক', category: 'Emergency' },
  { nameEn: 'Uterine Tumor Removal', nameBn: 'জরায়ুর টিউমার অপসারণ', category: 'Gynecology' },
  {
    nameEn: 'Fissure & Fistula Surgery',
    nameBn: 'ফিশার ও ফিস্টুলা সার্জারি',
    category: 'General Surgery',
  },
  {
    nameEn: 'Orthopedic & Trauma Surgery',
    nameBn: 'অর্থোপেডিক ও ট্রমা সার্জারি (হাড় ও জোড়ার চিকিৎসা)',
    category: 'Orthopedic',
  },
  {
    nameEn: 'Various Accident-related Surgeries',
    nameBn: 'দুর্ঘটনাজনিত বিভিন্ন অস্ত্রোপচার বা অপারেশন',
    category: 'Emergency',
  },
  { nameEn: 'Head Injury', nameBn: 'মাথায় আঘাত', category: 'Emergency' },
  { nameEn: 'Eye Injury', nameBn: 'চোখে আঘাত', category: 'Ophthalmology' },
  { nameEn: 'Laceration / Cut Wound', nameBn: 'কেটে যাওয়া', category: 'Emergency' },
  { nameEn: 'Road Accident', nameBn: 'রোড এক্সিডেন্ট', category: 'Emergency' },
  { nameEn: 'Electric Shock', nameBn: 'বিদ্যুৎ স্পৃষ্ট', category: 'Emergency' },
  { nameEn: 'Fall from Height', nameBn: 'ছাদ বা উঁচু স্থান থেকে পড়ে আঘাত', category: 'Emergency' },
  {
    nameEn: 'Respiratory Infection Surgery',
    nameBn: 'শ্বাস-প্রশ্বাস সমস্যা (শুধু ইনফেকশন অস্ত্রোপচার)',
    category: 'Respiratory',
  },
];
