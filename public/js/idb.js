// create a variable to hold the db connection
let db;
// establish a connection to IndexedDB called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function (e) {
	// save a reference to the db
	const db = e.target.result;
	// create an object store called 'new_transaction', set it to have an auto incrementing primary key
	db.createObjectStore('new_transaction', { autoIncrement: true });
};

// on a successful
request.onsuccess = function (e) {
	// when db is created with its object store or established connection, save reference to db in global variable
	db = e.target.result;

	// check if app is online, if yes run uploadBudget() to send all local db data to api
	if (navigator.online) {
		console.log('This function is not finished');
	}
};

request.onerror = function (e) {
	console.log(e.target.errorCode);
};

// this function will excecute if we attempt to submit a transaction and there is no connection
function saveRecord(record) {
	// open a new transaction with the database with read and write permissions
	const transaction = db.transaction(['new_transaction'], 'readwrite');

	// access the object store for `new_transaction`
	const transactionObjectStore = transaction.objectStore('new_transaction');

	// add record to the store with add method
	transactionObjectStore.add(record);
}

function uploadTransaction() {
	// open a transaction on the db
	const transaction = db.transaction(['new_transaction'], 'readwrite');

	// access the object store
	const transactionObjectStore = transaction.objectStore('new_transaction');

	// get all records from the store and assign to a variable
	const getAll = transactionObjectStore.getAll();

	// on a successful getAll()
	getAll.onsuccess = function () {
		// if there was data in indexedDB's store, send it to the api server
		if (getAll.result.length > 0) {
			fetch('/api/transaction', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json',
				},
			})
				.then((response) => response.json())
				.then((response) => {
					if (response.message) {
						throw new Error(response);
					}
					// open one more transaction
					const transaction = db.transaction(['new_transaction'], 'readwrite');
					// access the new_transaction object store
					const transactionObjectStore = transaction.objectStore('new_transaction');
					// clear all items in the store
					transactionObjectStore.clear();
					console.log('All saved transactions submitted');
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};
}

window.addEventListener('online', uploadTransaction);
