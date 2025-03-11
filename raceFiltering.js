const RaceFiltering = {
    filterRacesList() {
        console.log('[DEBUG] Starting race list filtering');
        const filters = {
            track: document.getElementById('filterTrack')?.value || '',
            laps: {
                min: parseInt(document.getElementById('filterMinLaps')?.value) || null,
                max: parseInt(document.getElementById('filterMaxLaps')?.value) || null
            },
            sortBy: document.getElementById('filterSort')?.value || 'time',
            hidePassworded: document.getElementById('hidePassworded')?.checked || false,
            showSuitableCarsOnly: document.getElementById('showSuitableCarsOnly')?.checked || false
        };
        
        console.log('[DEBUG] Active filters:', filters);
        
        const racesList = document.querySelector('.custom_events, .events-list, .races-list');
        if (!racesList) {
            console.log('[DEBUG] No races list found');
            return;
        }
        
        const races = Array.from(racesList.children);
        races.forEach(race => {
            let shouldShow = true;
            
            // Track filter
            if (filters.track && !this.matchesTrackFilter(race, filters.track)) {
                shouldShow = false;
            }
            
            // Suitable cars filter
            if (shouldShow && filters.showSuitableCarsOnly && !this.hasSuitableCar(race)) {
                console.log('[DEBUG] Hiding race due to no suitable car');
                shouldShow = false;
            }
            
            // Rest of existing filters...
            if (shouldShow && filters.laps.min && !this.matchesMinLapsFilter(race, filters.laps.min)) {
                shouldShow = false;
            }
            
            if (shouldShow && filters.laps.max && !this.matchesMaxLapsFilter(race, filters.laps.max)) {
                shouldShow = false;
            }
            
            if (shouldShow && filters.hidePassworded && this.isPasswordProtected(race)) {
                shouldShow = false;
            }
            
            race.style.display = shouldShow ? '' : 'none';
        });
        
        // Sort visible races
        const visibleRaces = races.filter(race => race.style.display !== 'none');
        visibleRaces.sort((a, b) => {
            switch(filters.sortBy) {
                case 'time': return this.compareTime(a, b);
                case 'track': return this.compareTrack(a, b);
                case 'laps': return this.compareLaps(a, b);
                case 'bets': return this.compareBets(a, b);
                default: return 0;
            }
        });
        
        // Reorder in DOM
        visibleRaces.forEach(race => racesList.appendChild(race));
    },

    getActiveFilters() {
        return {
            track: document.getElementById('filterTrack')?.value || '',
            laps: {
                min: parseInt(document.getElementById('filterMinLaps')?.value) || null,
                max: parseInt(document.getElementById('filterMaxLaps')?.value) || null
            },
            sortBy: document.getElementById('filterSort')?.value || 'time',
            hidePassworded: document.getElementById('hidePassworded')?.checked || false
        };
    },

    matchesTrackFilter(race, trackId) {
        if (!trackId) return true;
        const trackContent = race.textContent || '';
        return trackContent.includes(`Track ${trackId}`);
    },

    hasSuitableCar(race) {
        // Check if the race element contains the "no suitable car" message
        const notSuitableText = "You do not have a suitable car enlisted for this race.";
        return !race.textContent.includes(notSuitableText);
    },

    matchesMinLapsFilter(race, minLaps) {
        if (!minLaps) return true;
        const lapsMatch = race.textContent.match(/(\d+)\s*laps?/i);
        if (!lapsMatch) return true;
        const laps = parseInt(lapsMatch[1]) || 0;
        return laps >= minLaps;
    },

    matchesMaxLapsFilter(race, maxLaps) {
        if (!maxLaps) return true;
        const lapsMatch = race.textContent.match(/(\d+)\s*laps?/i);
        if (!lapsMatch) return true;
        const laps = parseInt(lapsMatch[1]) || 0;
        return laps <= maxLaps;
    },

    isPasswordProtected(race) {
        const raceText = race.textContent.toLowerCase();
        return raceText.includes('password') || race.querySelector('[id^="joinPasswordForm"]') !== null;
    },

    compareTime(a, b) {
        const getTime = el => {
            const timeText = el.textContent || '';
            
            // Handle "Waiting" case
            if (timeText.toLowerCase().includes('waiting')) {
                return 0;
            }

            // Handle "X h Y min" format
            const hoursMatch = timeText.match(/(\d+)\s*h/);
            const minutesMatch = timeText.match(/(\d+)\s*min/);
            if (hoursMatch || minutesMatch) {
                const hours = parseInt(hoursMatch?.[1] || '0');
                const minutes = parseInt(minutesMatch?.[1] || '0');
                return (hours * 60) + minutes;
            }

            // Handle "HH:MM" format
            const timeMatch = timeText.match(/(\d+):(\d+)/);
            if (timeMatch) {
                const [_, hours, minutes] = timeMatch;
                return (parseInt(hours) * 60) + parseInt(minutes);
            }

            return Infinity;
        };

        const timeA = getTime(a);
        const timeB = getTime(b);
        return timeA - timeB;
    },

    compareTrack(a, b) {
        const getTrackId = el => {
            const trackMatch = el.textContent.match(/Track\s+(\d+)/i);
            return parseInt(trackMatch?.[1]) || 0;
        };
        return getTrackId(a) - getTrackId(b);
    },

    compareLaps(a, b) {
        const getLaps = el => {
            const lapsMatch = el.textContent.match(/(\d+)\s*laps?/i);
            return parseInt(lapsMatch?.[1]) || 0;
        };
        return getLaps(a) - getLaps(b);
    },

    compareBets(a, b) {
        const getBet = el => {
            const betMatch = el.textContent.match(/\$([0-9,]+)/);
            return parseInt(betMatch?.[1]?.replace(/,/g, '')) || 0;
        };
        return getBet(b) - getBet(a); // Sort highest bets first
    },

    fetchAndDisplayRaces() {
        window.location.reload();
    }
};

// Export to global scope immediately
if (typeof window !== 'undefined') {
    window.RaceFiltering = RaceFiltering;
}
