# CREDIT TO: https://gist.github.com/wooddar/df4c89f381fa20ce819e94782dc5bc04 @wooddar
"""
This is an adaptable example script for using selenium across multiple webbrowsers simultaneously. This makes use of 
two queues - one to store idle webworkers and another to store data to pass to any idle webworkers in a selenium function
"""
from multiprocessing import Queue, cpu_count
from threading import Thread
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from time import sleep
from numpy.random import randint
from settings import SAMPLE_STAGING_USER, SAMPLE_STAGING_PASSWORD
import logging


logger = logging.getLogger(__name__)

# Some example data to pass the the selenium processes, this will just cause a sleep of time i
# This data can be a list of any datatype that can be pickled
selenium_data = [
                'https://mcweb-staging.tarbell.mediacloud.org/directory',
                'STOP',
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory', 
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory', 
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory', 
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory', 
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory', 
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory', 
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory', 
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory', 
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory', 
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory', 
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory', 
                # 'https://mcweb-staging.tarbell.mediacloud.org/directory'
                ]

# Create the two queues to hold the data and the IDs for the selenium workers
selenium_data_queue = Queue()
worker_queue = Queue()

# Create Selenium processes and assign them a worker ID
# This ID is what needs to be put on the queue as Selenium workers cannot be pickled
# By default, make one selenium process per cpu core with cpu_count
# TODO: Change the worker creation code to be your webworker of choice e.g. PhantomJS
worker_ids = list(range(cpu_count()))
selenium_workers = {i: webdriver.Chrome() for i in worker_ids}
for worker_id in worker_ids:
    worker_queue.put(worker_id)


def selenium_task(worker, data):
    """
    This is a demonstration selenium function that takes a worker and data and then does something with the worker and
    data.
    TODO: change the below code to be whatever it is you want your worker to do e.g. scrape webpages or run browser tests
    :param worker: A selenium web worker NOT a worker ID
    :type worker: webdriver.XXX
    :param data: Any data for your selenium function (must be pickleable)
    :rtype: None
    """
    worker.get('https://mcweb-staging.tarbell.mediacloud.org/sign-in')
    WebDriverWait(worker, 5).until(EC.presence_of_element_located((By.ID, 'text')))
    username = worker.find_element(By.ID, "text")
    username.clear()
    username.send_keys(SAMPLE_STAGING_USER)
    password = worker.find_element(By.ID, "password")
    password.send_keys(SAMPLE_STAGING_PASSWORD)
    submit = worker.find_element(By.CLASS_NAME, 'MuiButton-containedPrimary')
    submit.click()
    try:
        elem = WebDriverWait(worker, 10).until(EC.presence_of_element_located((By.ID, 'homepage')))
    except:
        worker.quit()

    worker.get(data)
    WebDriverWait(worker, 20).until(EC.presence_of_element_located((By.CLASS_NAME, 'featured-collection')))

def selenium_queue_listener(data_queue, worker_queue):
    """
    Monitor a data queue and assign new pieces of data to any available web workers to action
    :param data_queue: The python FIFO queue containing the data to run on the web worker
    :type data_queue: Queue
    :param worker_queue: The queue that holds the IDs of any idle workers
    :type worker_queue: Queue
    :rtype: None
    """
    logger.info("Selenium func worker started")
    while True:
        current_data = data_queue.get()
        if current_data == 'STOP':
            # If a stop is encountered then kill the current worker and put the stop back onto the queue
            # to poison other workers listening on the queue
            logger.warning("STOP encountered, killing worker thread")
            data_queue.put(current_data)
            break
        else:
            logger.info(f"Got the item {current_data} on the data queue")
        # Get the ID of any currently free workers from the worker queue
        worker_id = worker_queue.get()
        worker = selenium_workers[worker_id]
        # Assign current worker and current data to your selenium function
        selenium_task(worker, current_data)
        # Put the worker back into the worker queue as  it has completed it's task
        worker_queue.put(worker_id)
    return


# Create one new queue listener thread per selenium worker and start them
logger.info("Starting selenium background processes")
selenium_processes = [Thread(target=selenium_queue_listener,
                             args=(selenium_data_queue, worker_queue)) for _ in worker_ids]
for p in selenium_processes:
    p.daemon = True
    p.start()

# Add each item of data to the data queue, this could be done over time so long as the selenium queue listening
# processes are still running
logger.info("Adding data to data queue")
for d in selenium_data:
    selenium_data_queue.put(d)

# Wait for all selenium queue listening processes to complete, this happens when the queue listener returns
logger.info("Waiting for Queue listener threads to complete")
for p in selenium_processes:
    p.join()

# Quit all the web workers elegantly in the background
logger.info("Tearing down web workers")
for b in selenium_workers.values():
    b.quit()