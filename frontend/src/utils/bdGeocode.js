export const bdGeocode = [
  {
    division: "Barishal",
    districts: ["Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"]
  },
  {
    division: "Chattogram",
    districts: ["Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Cumilla", "Rangamati"]
  },
  {
    division: "Dhaka",
    districts: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"]
  },
  {
    division: "Khulna",
    districts: ["Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"]
  },
  {
    division: "Mymensingh",
    districts: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"]
  },
  {
    division: "Rajshahi",
    districts: ["Bogra", "Joypurhat", "Naogaon", "Natore", "Chapainawabganj", "Pabna", "Rajshahi", "Sirajganj"]
  },
  {
    division: "Rangpur",
    districts: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"]
  },
  {
    division: "Sylhet",
    districts: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"]
  }
];

/**
 * Fetch divisions list from the public API or fallback to static data
 */
export const fetchDivisions = async () => {
  try {
    const res = await fetch('https://raw.githubusercontent.com/sudipmhx/bd-apis/master/data/divisions.json');
    if (!res.ok) throw new Error('Network error fetching divisions');
    const data = await res.json();
    if (data && data.data) {
      return data.data.map(div => ({
        id: div.id,
        name: div.name || div.name_en
      })).sort((a, b) => a.name.localeCompare(b.name));
    }
    throw new Error('Invalid format');
  } catch (err) {
    console.warn('BD location API offline, utilizing static divisions fallback');
    return bdGeocode.map(g => ({
      id: g.division.toLowerCase(),
      name: g.division
    }));
  }
};

/**
 * Fetch districts list for a division from public API or fallback
 */
export const fetchDistricts = async (divisionName) => {
  try {
    const res = await fetch('https://raw.githubusercontent.com/sudipmhx/bd-apis/master/data/districts.json');
    if (!res.ok) throw new Error('Network error fetching districts');
    const data = await res.json();
    if (data && data.data) {
      // Find matching division ID or name
      const matchedGeo = bdGeocode.find(g => g.division.toLowerCase() === divisionName.toLowerCase());
      if (matchedGeo) {
        // Filter by the division
        return data.data
          .filter(dist => {
            const divName = dist.division?.toLowerCase() || '';
            return divName === divisionName.toLowerCase();
          })
          .map(dist => dist.name || dist.name_en)
          .sort((a, b) => a.localeCompare(b));
      }
    }
    throw new Error('Invalid format');
  } catch (err) {
    console.warn('BD location API offline, utilizing static districts fallback for ' + divisionName);
    const matched = bdGeocode.find(g => g.division.toLowerCase() === divisionName.toLowerCase());
    return matched ? matched.districts : [];
  }
};

/**
 * Fetch upazilas / thanas list for a district from public API or fallback
 */
export const fetchUpazilas = async (districtName) => {
  try {
    // 1. Fetch districts to resolve ID
    const distRes = await fetch('https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master/districts/districts.json');
    if (!distRes.ok) throw new Error('Districts fetch failed');
    const distData = await distRes.json();
    const districtsList = distData[2]?.data || [];
    
    // Normalize names to handle spaces or spelling differences
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const matchedDistrict = districtsList.find(
      d => normalize(d.name) === normalize(districtName)
    );
    
    if (!matchedDistrict) throw new Error('District not matched');
    
    // 2. Fetch upazilas
    const upzRes = await fetch('https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master/upazilas/upazilas.json');
    if (!upzRes.ok) throw new Error('Upazilas fetch failed');
    const upzData = await upzRes.json();
    const upazilasList = upzData[2]?.data || [];
    
    // Filter by district_id
    const filtered = upazilasList
      .filter(upz => upz.district_id === matchedDistrict.id)
      .map(upz => upz.name)
      .sort((a, b) => a.localeCompare(b));
      
    if (filtered.length > 0) return filtered;
    throw new Error('No upazilas matched');
  } catch (err) {
    console.warn('BD location API upazilas fetch failed, falling back to basic list', err);
    // Provide a mock fallback of major upazilas/thanas for common districts
    const fallbacks = {
      "dhaka": ["Dhanmondi", "Gulshan", "Uttara", "Mirpur", "Motijheel", "Badda", "Mohammadpur", "Tejgaon", "Khilgaon", "Savar", "Keraniganj"],
      "chattogram": ["Panchlaish", "Double Mooring", "Kotwali", "Halishahar", "Hathazari", "Sitakunda", "Mirsharai", "Patiya", "Sandwip"],
      "sylhet": ["Sylhet Sadar", "Beanibazar", "Golapganj", "Fenchuganj", "Zakiganj", "Kanaighat", "Balaganj"],
      "gazipur": ["Gazipur Sadar", "Kaliakair", "Sreepur", "Kaliganj", "Kapasia"],
      "narayanganj": ["Narayanganj Sadar", "Araihazar", "Bandar", "Rupganj", "Sonargaon"]
    };
    const key = districtName.toLowerCase().trim();
    return fallbacks[key] || [districtName + " Sadar", "Central " + districtName];
  }
};
