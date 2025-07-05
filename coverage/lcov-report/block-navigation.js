/* eslint-disable */
var jumpToCode = (function init() {
    // Classes of code we would like to highlight in the file view
    var missingCoverageClasses = ['.cbranch-no', '.cstat-no', '.fstat-no'];

    // Elements to highlight in the file listing view
    var fileListingElements = ['td.pct.low'];

    // We don't want to select elements that are direct descendants of another match
    var notSelector = ':not(' + missingCoverageClasses.join('):not(') + ') > '; // becomes `:not(a):not(b) > `

    // Selecter that finds elements on the page to which we can jump
    var selector =
        fileListingElements.join(', ') +
        ', ' +
        notSelector +
        missingCoverageClasses.join(', ' + notSelector); // becomes `:not(a):not(b) > a, :not(a):not(b) > b`

    // The NodeList of matching elements
    var missingCoverageElements = document.querySelectorAll(selector);

    var currentIndex;

    /**
     * Hebt das aktuell hervorgehobene Element auf und markiert das Element am angegebenen Index als hervorgehoben.
     * @param {number} index - Der Index des Elements, das hervorgehoben werden soll.
     */
    function toggleClass(index) {
        missingCoverageElements
            .item(currentIndex)
            .classList.remove('highlighted');
        missingCoverageElements.item(index).classList.add('highlighted');
    }

    /**
     * Hebt das Element mit dem angegebenen Index hervor und scrollt es zentriert in den sichtbaren Bereich.
     * 
     * @param {number} index - Der Index des zu markierenden Elements in der Liste der fehlenden Coverage-Elemente.
     */
    function makeCurrent(index) {
        toggleClass(index);
        currentIndex = index;
        missingCoverageElements.item(index).scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    }

    /**
     * Hebt das vorherige Element mit fehlender Coverage hervor und scrollt es in den sichtbaren Bereich.
     * Wenn das aktuell hervorgehobene Element das erste ist oder noch keines ausgewählt wurde, wird zum letzten Element gesprungen.
     */
    function goToPrevious() {
        var nextIndex = 0;
        if (typeof currentIndex !== 'number' || currentIndex === 0) {
            nextIndex = missingCoverageElements.length - 1;
        } else if (missingCoverageElements.length > 1) {
            nextIndex = currentIndex - 1;
        }

        makeCurrent(nextIndex);
    }

    /**
     * Hebt das nächste Element mit fehlender Coverage hervor und scrollt es in den sichtbaren Bereich. Springt zum ersten Element zurück, wenn das Ende erreicht ist.
     */
    function goToNext() {
        var nextIndex = 0;

        if (
            typeof currentIndex === 'number' &&
            currentIndex < missingCoverageElements.length - 1
        ) {
            nextIndex = currentIndex + 1;
        }

        makeCurrent(nextIndex);
    }

    return function jump(event) {
        if (
            document.getElementById('fileSearch') === document.activeElement &&
            document.activeElement != null
        ) {
            // if we're currently focused on the search input, we don't want to navigate
            return;
        }

        switch (event.which) {
            case 78: // n
            case 74: // j
                goToNext();
                break;
            case 66: // b
            case 75: // k
            case 80: // p
                goToPrevious();
                break;
        }
    };
})();
window.addEventListener('keydown', jumpToCode);
