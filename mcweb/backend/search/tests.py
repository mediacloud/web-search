from django.test import TestCase, LiveServerTestCase
# from django_webtest import WebTest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
# from settings import SAMPLE_STAGING_USER, SAMPLE_STAGING_PASSWORD
# # Create your tests here.

class TestSearchViews(TestCase):

#     def setUp(self):
#         self.driver = webdriver.Firefox()

    def test_multiple_queries(self):
        driver = webdriver.Firefox()

        driver.get('https://mcweb-staging.tarbell.mediacloud.org/sign-in')
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, 'text')))
        username = driver.find_element(By.ID, "text")
        username.clear()
        # username.send_keys(SAMPLE_STAGING_USER)
        password = driver.find_element(By.ID, "password")
        # password.send_keys(SAMPLE_STAGING_PASSWORD)
        submit = driver.find_element(By.CLASS_NAME, 'MuiButton-containedPrimary')
        submit.click()
        try:
            elem = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'homepage')))
        except:
            driver.quit()

        driver.get('https://mcweb-staging.tarbell.mediacloud.org/search')
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, 'service')))
        input = driver.find_element(By.ID, 'service')
        input.send_keys('test')
        query_popout = driver.find_element(By.CLASS_NAME, 'css-z7zmag')
        query_popout.click()
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'Compare Across Partisanship')]")))
        compare_across = driver.find_element(By.XPATH, "//*[contains(text(),'Compare Across Partisanship')]")
        compare_across.click()
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'Search')]")))
        submit = driver.find_element(By.XPATH, "//*[contains(text(),'Search')]")
        submit.click()
