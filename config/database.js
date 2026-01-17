// Database configuration with your specified branches
const BRANCHES = [
    'AIML',
    'ENTC', 
    'CS',
    'COMPUTER',
    'Mechanical'
  ];
  
  // Default sports
  const DEFAULT_SPORTS = [
    'Cricket',
    'Badminton',
    'Carom',
    'Chess',
    'Running',
    'Kho-Kho',
    'Kabaddi',
    'Volleyball'
  ];
  
  const GENDERS = ['Male', 'Female', 'Other'];
  const YEARS = ['1', '2', '3', '4'];
  
  let SPORTS = [...DEFAULT_SPORTS];
  
  const addSport = (sportName) => {
    const sport = sportName.trim();
    if (!SPORTS.includes(sport)) {
      SPORTS.push(sport);
      return true;
    }
    return false;
  };
  
  const addBranch = (branchName) => {
    const branch = branchName.trim().toUpperCase();
    if (!BRANCHES.includes(branch)) {
      BRANCHES.push(branch);
      return true;
    }
    return false;
  };
  
  module.exports = {
    BRANCHES,
    SPORTS,
    GENDERS,
    YEARS,
    addSport,
    addBranch
  };