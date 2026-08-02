require "test_helper"

class FoldersControllerTest < ActionDispatch::IntegrationTest
  test "should get create" do
    get folders_create_url
    assert_response :success
  end
end
