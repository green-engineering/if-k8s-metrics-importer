import {K8sMetricsImporter} from '../../../lib/k8s-metrics-importer';

describe('lib/k8s-metrics-importer: ', () => {

  describe('K8sMetricsImporter(): ', () => {
    it('has metadata field.', () => {
      const pluginInstance = K8sMetricsImporter({});

      expect(pluginInstance).toHaveProperty('metadata');
      expect(pluginInstance).toHaveProperty('execute');
      expect(pluginInstance.metadata).toHaveProperty('kind');
      expect(typeof pluginInstance.execute).toBe('function');
    });

    describe('execute(): with var ', () => {
      it('applies logic on provided inputs array.', async () => {
        const pluginInstance = K8sMetricsImporter({token:"xxx"});
        const inputs = [{duration:"15"}];

        const response = await pluginInstance.execute(inputs, {});
        expect(response).toEqual(inputs);
      });
    });

    describe('execute(): ENV Var ', () => {
      it('applies logic on provided inputs array.', async () => {
        const pluginInstance = K8sMetricsImporter({other:"xxxx"});
        const inputs = [{duration:"15"}];

        process.env.K8S_TOKEN = "xxx"

        const response = await pluginInstance.execute(inputs, {});
        expect(response).toEqual(inputs);
      });
    });

    describe('execute(): ERROR ', () => {
      it('applies logic on provided inputs array.', async () => {
        const pluginInstance = K8sMetricsImporter({other:"xxxx"});
        const inputs = [{duration:"15"}];

        const response = await pluginInstance.execute(inputs, {});
        expect(response).toThrow;
      });
    });

  });
});
