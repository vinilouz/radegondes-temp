import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/api';

function NewStudyPlan() {
  const { token, user } = useAuth();
  
  useEffect(() => {
    document.title = 'New Plan - Radegondes';
    fetchCategories();
    fetchInstitutions();
  }, []);

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest('.dropdown-container')) {
        setShowInstitutionsList(false);
        setShowCategoriesList(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const states = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO"
  ];

  const regions = {
    North: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
    Northeast: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
    "Center-West": ["DF", "GO", "MT", "MS"],
    South: ["PR", "RS", "SC"],
    Southeast: ["ES", "MG", "RJ", "SP"],
    Federal: ["DF"]
  };

  const [activeStates, setActiveStates] = useState([]);
  const [activeRegion, setActiveRegion] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [activeTypes, setActiveTypes] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitutions, setSelectedInstitutions] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showInstitutionsList, setShowInstitutionsList] = useState(false);
  const [showCategoriesList, setShowCategoriesList] = useState(false);
  const [expandedInstitution, setExpandedInstitution] = useState(null);
  const [selectedNotices, setSelectedNotices] = useState([]);
  const [noticeStats, setNoticeStats] = useState({});

  const institutionTypes = [
    "Public Contest", "ENEM", "Entrance Exam", "Medical Residency", "OAB", "Military Contest", "Others"
  ];

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Error fetching categories:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/institutions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data);
      } else {
        console.error('Error fetching institutions:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };

  const fetchNoticeStats = async (noticeName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notices/${encodeURIComponent(noticeName)}/stats`);
      if (response.ok) {
        const stats = await response.json();
        setNoticeStats(prev => ({
          ...prev,
          [noticeName]: {
            subjects: stats.subjects,
            topics: stats.topics
          }
        }));
      } else {
        console.error('Error fetching notice stats:', noticeName);
      }
    } catch (error) {
      console.error('Error fetching notice stats:', error);
    }
  };

  const handleRegionClick = (region) => {
    const regionStates = regions[region];
    
    if (activeRegion === region) {
      setActiveRegion(null);
      setActiveStates([]);
    } else {
      setActiveRegion(region);
      setActiveStates(regionStates);
    }
  };

    const handleStateClick = (state) => {
    setActiveRegion(null);
    
    setActiveStates(prev => {
      if (prev.includes(state)) {
        return prev.filter(uf => uf !== state);
      } else {
        return [...prev, state];
      }
    });
  };

  const handleCategoryChipClick = (categoryId) => {
    setActiveCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleTypeClick = (type) => {
    setActiveTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleInstitutionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowInstitutionsList(!showInstitutionsList);
    setShowCategoriesList(false);
  };

  const handleCategoryClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCategoriesList(!showCategoriesList);
    setShowInstitutionsList(false);
  };

  const handleInstitutionSelect = (institution) => {
    setSelectedInstitutions(prev => {
      if (prev.some(inst => inst._id === institution._id)) {
        return prev.filter(inst => inst._id !== institution._id);
      } else {
        return [...prev, institution];
      }
    });
  };

  const handleCategorySelect = (category) => {
    setSelectedCategories(prev => {
      if (prev.some(cat => cat._id === category._id)) {
        return prev.filter(cat => cat._id !== category._id);
      } else {
        return [...prev, category];
      }
    });
  };

  const toggleInstitution = (institutionId) => {
    setExpandedInstitution(
      expandedInstitution === institutionId ? null : institutionId
    );
  };

  const handleNoticeClick = (institution, notice) => {
    const noticeKey = `${institution._id}-${notice}`;
    setSelectedNotices(prev => {
      const alreadyExists = prev.some(item => item.id === noticeKey);
      if (alreadyExists) {
        return prev.filter(item => item.id !== noticeKey);
      } else {
        fetchNoticeStats(notice);
        
        return [...prev, {
          id: noticeKey,
          institution: {
            name: institution.name,
            acronym: institution.acronym,
            _id: institution._id
          },
          notice: notice
        }];
      }
    });
  };

  const removeNotice = (noticeId) => {
    setSelectedNotices(prev => prev.filter(item => item.id !== noticeId));
  };

  const calculateTotals = () => {
    let totalSubjects = 0;
    let totalTopics = 0;
    
    selectedNotices.forEach(item => {
      const stats = noticeStats[item.notice];
      if (stats) {
        totalSubjects += stats.subjects;
        totalTopics += stats.topics;
      }
    });
    
    return { totalSubjects, totalTopics };
  };

  const createPlan = async () => {
    if (selectedNotices.length === 0) {
      alert('Select at least one notice to create a plan.');
      return;
    }

    try {
      const uniqueInstitutions = [...new Set(selectedNotices.map(item => item.institution.acronym))];
      let planName;

      if (uniqueInstitutions.length === 1) {
        const institutionName = selectedNotices[0].institution.name;
        planName = `Plan ${institutionName}`;
      } else {
        const userName = user?.firstName || 'User';
        
        const plansResponse = await fetch(`${API_BASE_URL}/api/study-plans`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let planNumber = 1;
        if (plansResponse.ok) {
          const existingPlans = await plansResponse.json();
          const userPlans = existingPlans.filter(plan =>
            plan.name.startsWith(`Plan ${userName}`)
          );
          planNumber = userPlans.length + 1;
        }

        planName = planNumber === 1 ? `Plan ${userName}` : `Plan ${userName} ${planNumber}`;
      }

      // The backend needs to be adapted to accept an array of notices/cargos
      // and create the plan with the corresponding subjects.
      const response = await fetch(`${API_BASE_URL}/api/study-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: planName,
          notices: selectedNotices.map(item => item.notice) // Sending notice names
        })
      });

      if (response.ok) {
        window.location.href = '/study-plans';
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(errorData.message || 'Error creating plan.');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Error creating plan. Please try again.');
    }
  };

  const isNoticeSelected = (institution, notice) => {
    const noticeKey = `${institution._id}-${notice}`;
    return selectedNotices.some(item => item.id === noticeKey);
  };

  const getFilteredInstitutions = () => {
    return institutions.filter(institution => {
      if (!institution.positions || institution.positions.length === 0) {
        return false;
      }
      if (activeStates.length > 0) {
        if (!activeStates.includes(institution.state)) {
          return false;
        }
      }
      if (activeTypes.length > 0) {
        if (!activeTypes.includes(institution.type)) {
          return false;
        }
      }
      if (selectedCategories.length > 0) {
        const hasCategory = selectedCategories.some(selectedCat =>
          institution.category && institution.category._id === selectedCat._id
        );
        if (!hasCategory) {
          return false;
        }
      }
      if (selectedInstitutions.length > 0) {
        const isSelected = selectedInstitutions.some(selectedInst =>
          selectedInst._id === institution._id
        );
        if (!isSelected) {
          return false;
        }
      }
      if (searchText.trim() !== '') {
        const term = searchText.toLowerCase();
        const nameMatch = institution.name.toLowerCase().includes(term);
        const acronymMatch = institution.acronym.toLowerCase().includes(term);
        const cityMatch = institution.city.toLowerCase().includes(term);
        const typeMatch = institution.type.toLowerCase().includes(term);
        const positionMatch = institution.positions.some(position =>
          position.toLowerCase().includes(term)
        );
        
        if (!nameMatch && !acronymMatch && !cityMatch && !typeMatch && !positionMatch) {
          return false;
        }
      }
      return true;
    });
  };

  return (
    <div className="novo-plano-page">
      <header className='flex flex-col head'>
        <h1>New Study Plan</h1>
      </header>
      
      <div className="regions">
        <div className="flex justify-between item states">
          <span 
            onClick={() => handleRegionClick('North')}
            className={activeRegion === 'North' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            North
          </span>
          <span 
            onClick={() => handleRegionClick('Northeast')}
            className={activeRegion === 'Northeast' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            Northeast
          </span>
          <span 
            onClick={() => handleRegionClick('Center-West')}
            className={activeRegion === 'Center-West' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            Center-West
          </span>
          <span 
            onClick={() => handleRegionClick('South')}
            className={activeRegion === 'South' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            South
          </span>
          <span 
            onClick={() => handleRegionClick('Southeast')}
            className={activeRegion === 'Southeast' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            Southeast
          </span>
          <span 
            onClick={() => handleRegionClick('Federal')}
            className={activeRegion === 'Federal' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            Federal
          </span>
        </div>
        <div className="flex flex-wrap gap-2 item uf">
          {states.map(uf => (
            <span 
              key={uf} 
              className={activeStates.includes(uf) ? 'active' : ''}
              onClick={() => handleStateClick(uf)}
              style={{ cursor: 'pointer' }}
            >
              {uf}
            </span>
          ))}
        </div>
      </div>

      <div className="regions">
        <div className="flex flex-wrap gap-2 item uf">
          {institutionTypes.map(type => (
            <span 
              key={type}
              className={activeTypes.includes(type) ? 'active' : ''}
              onClick={() => handleTypeClick(type)}
              style={{ cursor: 'pointer' }}
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      <div className="regions">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }} className="item uf">
          <div className="dropdown-container" style={{ position: 'relative' }}>
            <input
              type="text"
              value={
                selectedInstitutions.map(inst => inst.acronym).join(', ')
              }
              onClick={handleInstitutionClick}
              placeholder="Select institutions..."
              style={{
                width: '100%',
                padding: '8px 40px 8px 12px',
                border: '1px solid #E6691230',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#E6691215',
                color: 'var(--darkmode-text-primary)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23E66912' viewBox='0 0 16 16'%3e%3cpath d='m7.247 11.14 4.796-5.481c.566-.647.106-1.659-.753-1.659H1.698a1 1 0 0 0-.753 1.659l4.796 5.48a1 1 0 0 0 1.506 0z'/%3e%3c/svg%3e\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '12px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#E6691225';
                e.target.style.borderColor = '#E6691240';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#E6691215';
                e.target.style.borderColor = '#E6691230';
              }}
              readOnly
            />
            {showInstitutionsList && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#E6691215',
                border: '1px solid #E6691230',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {institutions.map(institution => (
                  <div
                    key={institution._id}
                    onClick={() => handleInstitutionSelect(institution)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--darkmode-border-secondary)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--darkmode-text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--darkmode-bg-tertiary)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'var(--darkmode-bg-secondary)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedInstitutions.some(inst => inst._id === institution._id)
                      }
                      onChange={() => {}}
                      style={{ pointerEvents: 'none' }}
                    />
                    {institution.acronym} - {institution.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dropdown-container" style={{ position: 'relative' }}>
            <input
              type="text"
              value={
                selectedCategories.map(cat => cat.name).join(', ')
              }
              onClick={handleCategoryClick}
              placeholder="Select categories..."
              style={{
                width: '100%',
                padding: '8px 40px 8px 12px',
                border: '1px solid #E6691230',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#E6691215',
                color: 'var(--darkmode-text-primary)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23E66912' viewBox='0 0 16 16'%3e%3cpath d='m7.247 11.14 4.796-5.481c.566-.647.106-1.659-.753-1.659H1.698a1 1 0 0 0-.753 1.659l4.796 5.48a1 1 0 0 0 1.506 0z'/%3e%3c/svg%3e\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '12px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#E6691225';
                e.target.style.borderColor = '#E6691240';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#E6691215';
                e.target.style.borderColor = '#E6691230';
              }}
              readOnly
            />
            {showCategoriesList && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#E6691215',
                border: '1px solid #E6691230',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {categories.map(category => (
                  <div
                    key={category._id}
                    onClick={() => handleCategorySelect(category)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--darkmode-border-secondary)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--darkmode-text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--darkmode-bg-tertiary)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'var(--darkmode-bg-secondary)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedCategories.some(cat => cat._id === category._id)
                      }
                      onChange={() => {}}
                      style={{ pointerEvents: 'none' }}
                    />
                    {category.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, acronym, city..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #E6691230',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#E6691215',
                color: 'var(--darkmode-text-primary)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = '#E6691225';
                e.target.style.borderColor = '#E66912';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#E6691215';
                e.target.style.borderColor = '#E6691230';
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex w-100 planos">
        <section style={{ flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
              Available Institutions
            </h3>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--darkmode-text-secondary)',
              backgroundColor: 'var(--darkmode-bg-tertiary)',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--darkmode-border-secondary)'
            }}>
              {getFilteredInstitutions().length} of {institutions.filter(inst => inst.positions && inst.positions.length > 0).length} institutions
            </div>
          </div>
          
          <div className="instituicoes-list">
            {getFilteredInstitutions().map(institution => (
              <div 
                key={institution._id}
                className="instituicao-card"
                style={{
                  border: '1px solid var(--darkmode-border-secondary)',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  backgroundColor: 'var(--darkmode-bg-secondary)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div 
                  className="instituicao-header"
                  onClick={() => toggleInstitution(institution._id)}
                  style={{
                    padding: '15px 20px',
                    cursor: 'pointer',
                    borderBottom: expandedInstitution === institution._id ? '1px solid var(--darkmode-border-secondary)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: expandedInstitution === institution._id ? 'var(--darkmode-bg-tertiary)' : 'var(--darkmode-bg-secondary)'
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                      {institution.acronym} - {institution.name}
                    </h4>
                    <p style={{ margin: '5px 0 0 0', color: 'var(--darkmode-text-secondary)', fontSize: '14px' }}>
                      {institution.city}, {institution.state} • {institution.type}
                    </p>
                  </div>
                  <div style={{ fontSize: '18px', color: 'var(--darkmode-text-secondary)' }}>
                    {expandedInstitution === institution._id ? '−' : '+'}
                  </div>
                </div>
                
                {expandedInstitution === institution._id && institution.positions && institution.positions.length > 0 && (
                  <div className="cargos-list" style={{ padding: '15px 20px' }}>
                    <h5 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--darkmode-text-primary)', fontWeight: '600' }}>
                      Available Notices:
                    </h5>
                    <div className="cargos-grid" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {institution.positions.map((notice, index) => {
                        const isSelected = isNoticeSelected(institution, notice);
                        return (
                          <div
                            key={index}
                            className="cargo-item"
                            onClick={() => handleNoticeClick(institution, notice)}
                            style={{
                              padding: '10px 15px',
                              border: isSelected ? '2px solid var(--orange-primary)' : '1px solid var(--darkmode-border-secondary)',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              backgroundColor: isSelected ? 'var(--darkmode-bg-elevation-1)' : 'var(--darkmode-bg-tertiary)',
                              fontSize: '13px',
                              fontWeight: isSelected ? '600' : '400',
                              color: isSelected ? 'var(--orange-primary)' : 'var(--darkmode-text-primary)',
                              textAlign: 'center'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.target.style.backgroundColor = 'var(--darkmode-bg-elevation-1)';
                                e.target.style.borderColor = 'var(--darkmode-border-tertiary)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.target.style.backgroundColor = 'var(--darkmode-bg-tertiary)';
                                e.target.style.borderColor = 'var(--darkmode-border-secondary)';
                              }
                            }}
                          >
                            {notice}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {expandedInstitution === institution._id && (!institution.positions || institution.positions.length === 0) && (
                  <div style={{ padding: '15px 20px', color: 'var(--darkmode-text-secondary)', fontStyle: 'italic', fontSize: '14px' }}>
                    No notices registered for this institution.
                  </div>
                )}
              </div>
            ))}
          </div>

          {getFilteredInstitutions().length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--darkmode-text-secondary)' }}>
              <p>
                {institutions.length === 0
                  ? 'No institutions registered yet.'
                  : 'No institutions found with the applied filters.'
                }
              </p>
            </div>
          )}
        </section>
        
        <aside style={{ flex: 1, marginLeft: '20px' }}>
          <div style={{ 
            backgroundColor: 'var(--darkmode-bg-secondary)', 
            borderRadius: '8px',
            border: '1px solid var(--darkmode-border-secondary)'
          }}>
            {selectedNotices.length > 0 ? (
              <div>
                {(() => {
                  const groupedNotices = selectedNotices.reduce((acc, item) => {
                    const institutionAcronym = item.institution.acronym;
                    if (!acc[institutionAcronym]) {
                      acc[institutionAcronym] = {
                        institution: item.institution,
                        notices: []
                      };
                    }
                    acc[institutionAcronym].notices.push(item);
                    return acc;
                  }, {});

                  return Object.values(groupedNotices).map((group) => (
                    <div
                      key={group.institution.acronym}
                      style={{
                        marginBottom: '15px',
                        padding: '20px',
                        backgroundColor: 'var(--darkmode-bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--darkmode-border-secondary)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid var(--darkmode-border-secondary)'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: 'var(--darkmode-bg-tertiary)',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          border: '1px solid var(--darkmode-border-secondary)'
                        }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--darkmode-text-secondary)' }}>
                            {group.institution.acronym}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: '16px', 
                            fontWeight: '600',
                            color: 'var(--darkmode-text-primary)'
                          }}>
                            {group.institution.name}
                          </h4>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--darkmode-text-secondary)',
                            marginTop: '4px'
                          }}>
                            {group.notices.length} notice{group.notices.length > 1 ? 's' : ''} selected
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {group.notices.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              backgroundColor: 'var(--darkmode-bg-tertiary)',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: 'var(--darkmode-text-primary)',
                              border: '1px solid var(--darkmode-border-secondary)'
                            }}
                          >
                            <span>
                              {item.notice}
                              {noticeStats[item.notice] && (
                                <span style={{ 
                                  color: 'var(--darkmode-text-secondary)', 
                                  fontSize: '12px', 
                                  marginLeft: '8px',
                                  fontWeight: 'normal'
                                }}>
                                  ({noticeStats[item.notice].subjects} subjects / {noticeStats[item.notice].topics} topics)
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => removeNotice(item.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--darkmode-button-danger)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--darkmode-bg-tertiary)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                              }}
                              title="Remove notice"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
                
                <div style={{ padding: '0 20px 20px' }}>
                  <button
                    onClick={createPlan}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'var(--orange-primary)',
                      color: 'var(--darkmode-text-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--orange-primary-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'var(--orange-primary)';
                    }}
                  >
                    Create Plan with {selectedNotices.length} Notice{selectedNotices.length > 1 ? 's' : ''}
                  </button>
                  
                  {selectedNotices.length > 0 && (() => {
                    const { totalSubjects, totalTopics } = calculateTotals();
                    return (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        backgroundColor: 'var(--darkmode-bg-tertiary)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: 'var(--darkmode-text-secondary)',
                        textAlign: 'center',
                        border: '1px solid var(--darkmode-border-secondary)'
                      }}>
                        <strong style={{ color: 'var(--darkmode-text-primary)' }}>Total: {totalSubjects} subject{totalSubjects !== 1 ? 's' : ''} • {totalTopics} topic{totalTopics !== 1 ? 's' : ''}</strong>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--darkmode-text-secondary)', 
                padding: '40px 20px',
                backgroundColor: 'var(--darkmode-bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--darkmode-border-secondary)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
                  📋
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: 'var(--darkmode-text-primary)' }}>
                  No notices selected
                </h4>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4', color: 'var(--darkmode-text-secondary)' }}>
                  Select notices from the institutions to create your custom study plan.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default NewStudyPlan;
