require "test_helper"

class MemosControllerTest < ActionDispatch::IntegrationTest
  test "should get create" do
    get memos_create_url
    assert_response :success
  end
end
