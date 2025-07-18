import {
  fetchStories,
  fetchStory,
  fetchStoryViews,
  createStory,
  deleteStory,
} from '../stories';

// Mock de fetch global
global.fetch = jest.fn();

describe('Stories API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('fetchStories', () => {
    it('should fetch stories successfully', async () => {
      const mockResponse = {
        success: true,
        stories: [
          {
            user_id: 1,
            user_nom: 'Doe',
            user_prenom: 'John',
            user_avatar: 'avatar.jpg',
            stories: [
              {
                id: 1,
                user_id: 1,
                image: 'image.jpg',
                legend: 'Test story',
                created_at: '2023-01-01T12:00:00',
                view_count: 5,
                viewed_by_me: false,
              },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchStories();
      expect(result).toEqual(mockResponse.stories);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stories.php'),
        expect.objectContaining({ credentials: 'include' })
      );
    });

    it('should fetch friends stories with the correct parameter', async () => {
      const mockResponse = {
        success: true,
        stories: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchStories(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stories.php?friends=true'),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: errorMessage }),
      });

      await expect(fetchStories()).rejects.toThrow(errorMessage);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      await expect(fetchStories()).rejects.toThrow(
        'Connexion au serveur impossible'
      );
    });
  });

  describe('fetchStory', () => {
    it('should fetch a single story successfully', async () => {
      const mockStory = {
        id: 1,
        user_id: 1,
        user_nom: 'Doe',
        user_prenom: 'John',
        user_avatar: 'avatar.jpg',
        image: 'image.jpg',
        legend: 'Test story',
        created_at: '2023-01-01T12:00:00',
        view_count: 5,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, story: mockStory }),
      });

      const result = await fetchStory(1);
      expect(result).toEqual(mockStory);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stories.php?id=1'),
        expect.any(Object)
      );
    });
  });

  describe('deleteStory', () => {
    it('should delete a story successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Story supprimée avec succès',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await deleteStory(1);
      expect(result).toEqual(mockResponse.message);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stories.php?id=1'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        })
      );
    });
  });
});
