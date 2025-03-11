const RaceFiltering = {
    filterRacesList() {
        const hidePassworded = document.getElementById('hidePassworded').checked;
        const sortBy = document.getElementById('filterSort').value;
        const racesList = document.querySelector('.custom_events, .events-list, .races-list');
        
        if (!racesList) return;
        
        const races = Array.from(racesList.children);
        if (!races.length) return;
        
        races.forEach(race => {
            // Handle passworded races visibility
            const isPassworded = race.querySelector('[id^="joinPasswordForm"]');
            race.style.display = hidePassworded && isPassworded ? 'none' : '';
        });
        
        // Sort races based on selected criteria
        races.sort((a, b) => {
            switch(sortBy) {
                case 'time':
                    return this.compareTime(a, b);
                case 'track':
                    return this.compareTrack(a, b);
                case 'laps':
                    return this.compareLaps(a, b);
                case 'bets':
                    return this.compareBets(a, b);
                default:
                    return 0;
            }
        });
        
        // Reorder races in DOM
        races.forEach(race => racesList.appendChild(race));
    },

    compareTime(a, b) {
        const getTime = el => {
            const timeText = el.querySelector('.time')?.textContent || '0';
            return parseInt(timeText) || 0;
        };
        return getTime(a) - getTime(b);
    },

    compareTrack(a, b) {
        const getTrack = el => el.querySelector('.track')?.textContent || '';
        return getTrack(a).localeCompare(getTrack(b));
    },

    compareLaps(a, b) {
        const getLaps = el => {
            const lapsText = el.querySelector('.laps')?.textContent || '0';
            return parseInt(lapsText) || 0;
        };
        return getLaps(a) - getLaps(b);
    },

    compareBets(a, b) {
        const getBet = el => {
            const betText = el.querySelector('.bet')?.textContent || '0';
            return parseInt(betText.replace(/[^0-9]/g, '')) || 0;
        };
        return getBet(a) - getBet(b);
    },

    fetchAndDisplayRaces() {
        window.location.reload();
    }
};

window.RaceFiltering = RaceFiltering;
