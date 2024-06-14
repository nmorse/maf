
function CircularList(size) {
    let items = new Array(size);
    let headIndex = 0;
    let tailIndex = 0;
    let iterationIndex = 0;
    let length = 0;

    const nextIndex = (index) => (index + 1) % size;

    const clear = () => {
        items = []
        headIndex = 0
        tailIndex = 0
        iterationIndex = 0
        length = 0
    }

    const enqueue = (item) => {
        if (nextIndex(tailIndex) !== headIndex) {
            items[tailIndex] = item;
            tailIndex = nextIndex(tailIndex);
            length++
        } else {
            throw new Error('Circular list is full. Cannot enqueue.');
        }
    };

    const dequeue = () => {
        if (headIndex !== tailIndex) {
            const item = items[headIndex];
            headIndex = nextIndex(headIndex);
            length--
            return item;
        } else {
            throw new Error('Circular list is empty. Cannot dequeue.');
        }
    };

    const resetIterate = () => {
        iterationIndex = headIndex; //(headIndex - 1 + size) % (size || 1);
    };

    const nextItem = () => {
        if (iterationIndex === tailIndex) {
            return null;
        }
        const currentItem = items[iterationIndex];
        iterationIndex = (iterationIndex + 1) % (size || 1);
        return currentItem;
    };

    return {
        nextItem,
        resetIterate,
        enqueue,
        dequeue,
        clear
    };

}
