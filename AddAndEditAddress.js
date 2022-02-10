import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, TextInput,
} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import Geocoder from '@timwangdev/react-native-geocoder';
import RNPickerSelect from 'react-native-picker-select';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from "react-hook-form";
import {
  StylesGlobal,
  Mixins,
  Colors,
  Typography,
  StylesPickerLocation,
} from '../../../styles';
import MiLocalization from '../../../components/MiLocalization';
import ButtonCustom from '../../../components/ButtonCustom';
import TextCustom from '../../../components/TextCustom';
import AlertText from '../../../components/AlertText';
import MapModal from '../../../components/MapModal';
import Messages from '../../../resources/messages';
import Alerta from '../../../components/Alerta';

// Actions
import { GetSuburbsByZipCode } from '../../../store/actions/locationAction';
import { getAddress, updateAddress, createAddress } from '../../../store/actions/addressAction';

// Types 
import { types } from '../../../store/types/types';

export default function AddAndEditAddress({ navigation, route }) {
  const dispatch = useDispatch();

  const [showSpinner, setShowSpinner] = useState(false);

  const [addressId, setAddressId] = useState(0);
  const [addressInformation, setAddressInformation] = useState(null);

  const [countFetch, setCountFetch] = useState(0);

  const [suburbsArr, setSuburbsArr] = useState([]);
  const [suburbId, setSuburbId] = useState(0);

  const [state, setState] = useState(null);
  const [municipality, setMunicipality] = useState(null);

  const [showAlert, setShowAlert] = useState(false);
  const [titleMessage, setTitleMessage] = useState(null);
  const [messageAlert, setMessageAlert] = useState('');

  const [showMapModal, setShowMapModal] = useState(false);
  const [coords, setCoords] = useState({
    latitude: 20.677390709881173,
    longitude: -103.37274684900193,
  });

  /* Selector State */
  const userLogin = useSelector(state => state.userLogin);
  const { userInfo } = userLogin;

  const address = useSelector(state => state.address);

  const addAddress = useSelector(state => state.addAddress);

  const suburbsResult = useSelector(state => state.suburbsByPostalCode);
  const { suburbsByPC } = suburbsResult;
  /* Selector State */

  useEffect(() => {
    if (!userInfo)
      navigation.goBack();
  }, [userInfo])

  useEffect(() => {
    console.log(route.params);
    if (route.params) {
      setCountFetch(1);
      setAddressId(route.params.addressId);
      dispatch(getAddress(route.params.addressId, userInfo.id));
    }
  }, [route.params])

  useEffect(() => {
    if (suburbsByPC) {
      const newSuburbs = [];
      for (let i = 0; i < suburbsByPC.data.length; i++) {
        const element = suburbsByPC.data[i];
        newSuburbs.push({ label: element.name, value: element.id });
      }
      setSuburbsArr(newSuburbs);
      if (address.data) {
        setSuburbId(address.data.suburbId);
        GetCityAndOthersFieldsBySuburbId(address.data.suburbId);
        dispatch({ type: types.addressTypes.ADDRESS_CLEAN });
      }
    }
  }, [suburbsByPC])

  useEffect(() => {
    if (address && Object.keys(address).length !== 0) {
      setShowSpinner(address.loading);
      if (address.data) {
        setValue('name', address.data.firstName);
        setValue('lastName', address.data.lastName);
        setValue('street', address.data.address1);
        setValue('externalNumber', address.data.externalNumber);
        setValue('internalNumber', address.data.internalNumber);
        setValue('postalCode', address.data.zipPostalCode);
        setValue('betStreet', address.data.betweenStreet);
        setValue('andStreet', address.data.betweenStreet2);
        setValue('phone', address.data.phoneNumber);
        setValue('references', address.data.references);

        dispatch(GetSuburbsByZipCode(address.data.zipPostalCode));

        if (countFetch > 1) {
          setShowAlert(true);
          setTitleMessage('');
          setMessageAlert(Messages.addAndEditAddress.alertSuccesMessage);
        }
        setCountFetch(countFetch + 1);
      }
      if (address.error) {
        setShowAlert(true);
        setMessageAlert(address.error);
      }
      setShowMapModal(false);
    }
    if (addAddress && Object.keys(addAddress).length !== 0) {
      setShowSpinner(addAddress.loading);
      if (addAddress.data && addAddress.data.status === 200) {
        setShowAlert(true);
        setTitleMessage('');
        setMessageAlert(Messages.addAndEditAddress.alertCreateSuccesMessage);
        dispatch({ type: types.addressTypes.ADDRESS_ADD_CLEAN });
      }
      if (addAddress.error) {
        setShowAlert(true);
        setMessageAlert(addAddress.error);
      }
      setShowMapModal(false);
    }
  }, [address, addAddress])

  const { control, handleSubmit, formState: { errors }, setValue } = useForm();
  const onSubmit = (async (data) => {
    if (suburbId !== 0) {
      const result = await Geocoder.geocodeAddress(`${data.street} ${data.externalNumber} ${municipality} ${state}`);
      if (result && result.length > 0) {
        setCoords({
          latitude: result[0].position.lat,
          longitude: result[0].position.lng,
        });
      }
      setShowMapModal(true);
      setAddressInformation(data);
    } else {
      setShowAlert(true);
      setMessageAlert(Messages.addAndEditAddress.suburbRequired);
    }
  });

  const OnRegister = async () => {
    const addressObject = {
      Id: (route.params) ? addressId : 0,
      FirstName: addressInformation.name,
      LastName: addressInformation.lastName,
      Address: addressInformation.street,
      ExternalNumber: addressInformation.externalNumber,
      InternalNumber: addressInformation.internalNumber,
      PostalCode: addressInformation.postalCode,
      SuburbId: suburbId,
      Street: addressInformation.betStreet,
      Street2: addressInformation.andStreet,
      PhoneNumber: addressInformation.phone,
      References: addressInformation.references,
      Latitude: coords.latitude,
      Longitude: coords.longitude
    };
    console.log(addressObject);
    if (route.params) {
      dispatch(updateAddress(addressObject))
    } else {
      dispatch(createAddress(addressObject));
    }
  };

  const GetCityAndOthersFieldsBySuburbId = (itemId) => {
    if (suburbsByPC && itemId !== 0) {
      setSuburbId(itemId);
      let suburb = suburbsByPC.data.find(element => element.id == itemId);
      setMunicipality(suburb.municipality.name);
      setState(suburb.municipality.stateProvince.name);
    } else {
      setSuburbId(0);
      setMunicipality(null);
      setState(null);
    }
  };

  return (
    <View
      style={[
        StylesGlobal.bgColorGrayScreen,
        Mixins.margin('5%', 0, 0, 0),
        Mixins.size('100%', '100%'),
      ]}
    >
      <Spinner
        visible={showSpinner}
        textContent={'Cargando...'}
        textStyle={StylesGlobal.textWhite}
      />
      <View
        style={[StylesGlobal.alignCenterContent]}
      >
        <TextCustom
          styles={[
            StylesGlobal.textBlackBold,
            Typography.FONT_SIZE_CUSTOM(15),
          ]}
          value="¿Dónde quieres que entreguemos tus bebidas?"
        />
        <MiLocalization
          onComplete={async (coords) => {
            try {
              const result = await Geocoder.geocodePosition({ lat: coords.latitude, lng: coords.longitude });
              if (result && result.length > 0) {
                setValue('street', result[0]?.streetName);
                setValue('externalNumber', result[0]?.streetNumber);
                setValue('postalCode', result[0]?.postalCode);
                setState(result[0]?.adminArea);
                setMunicipality(result[0]?.locality);
              }
            } catch (error) {
              console.log(error);
            }
          }}
        />
      </View>
      <ScrollView
        style={Mixins.size('100%')}
      >
        <View
          style={[
            StylesGlobal.alignCenterContent,
            Mixins.margin(20, 0, 0, 0),
          ]}
        >
          <TextCustom
            styles={[
              StylesGlobal.textGrayMedium,
              Typography.FONT_SIZE_CUSTOM(16),
            ]}
            value="DIRECCIÓN"
          />
          <Controller
            control={control}
            rules={{
              required: true,
              maxLength: 100,
              pattern: /^[A-Za-z0-9\s]+$/g,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  StylesGlobal.alignCenterContent,
                  StylesGlobal.bColorPrimary,
                  (errors.name) ? StylesGlobal.bColorWarning : {},
                  Mixins.borderRad(60),
                  Mixins.size('90%', 50),
                  Mixins.padding(0, 10, 0, 10),
                  Mixins.margin(10, 0, 0, 0),
                ]}
              >
                <TextInput
                  style={[
                    StylesGlobal.textGrayDark,
                    Typography.FONT_SIZE_CUSTOM(16),
                    Mixins.size('100%', 50)
                  ]}
                  value={value}
                  maxLength={100}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  allowFontScaling={false}
                  placeholder="Nombre"
                  placeholderTextColor={Colors.GRAY_DARK}
                />
              </View>
            )}
            name="name"
            defaultValue=""
          />
          {errors.name?.type === 'required' && (<AlertText val={Messages.addAndEditAddress.nameRequired} />)}
          {errors.name?.type === 'pattern' && (<AlertText val={Messages.addAndEditAddress.namePattern} />)}
          <Controller
            control={control}
            rules={{
              required: true,
              maxLength: 50,
              pattern: /^[A-Za-z0-9\s]+$/g,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  StylesGlobal.alignCenterContent,
                  StylesGlobal.bColorPrimary,
                  (errors.lastName) ? StylesGlobal.bColorWarning : {},
                  Mixins.borderRad(60),
                  Mixins.size('90%', 50),
                  Mixins.padding(0, 10, 0, 10),
                  Mixins.margin(10, 0, 0, 0),
                ]}
              >
                <TextInput
                  style={[
                    StylesGlobal.textGrayDark,
                    Typography.FONT_SIZE_CUSTOM(16),
                    Mixins.size('100%', 50)
                  ]}
                  value={value}
                  maxLength={50}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  allowFontScaling={false}
                  placeholder="Apellido"
                  placeholderTextColor={Colors.GRAY_DARK}
                />
              </View>
            )}
            name="lastName"
            defaultValue=""
          />
          {errors.lastName?.type === 'required' && (<AlertText val={Messages.addAndEditAddress.lastNameRequired} />)}
          {errors.lastName?.type === 'pattern' && (<AlertText val={Messages.addAndEditAddress.lastNamePattern} />)}
          <Controller
            control={control}
            rules={{
              required: true,
              maxLength: 100,
              pattern: /^[A-Za-z0-9\s]+$/g,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  StylesGlobal.alignCenterContent,
                  StylesGlobal.bColorPrimary,
                  (errors.street) ? StylesGlobal.bColorWarning : {},
                  Mixins.borderRad(60),
                  Mixins.size('90%', 50),
                  Mixins.padding(0, 10, 0, 10),
                  Mixins.margin(10, 0, 0, 0),
                ]}
              >
                <TextInput
                  style={[
                    StylesGlobal.textGrayDark,
                    Typography.FONT_SIZE_CUSTOM(16),
                    Mixins.size('100%', 50)
                  ]}
                  value={value}
                  maxLength={100}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  allowFontScaling={false}
                  placeholder="Calle"
                  placeholderTextColor={Colors.GRAY_DARK}
                />
              </View>
            )}
            name="street"
            defaultValue=""
          />
          {errors.street?.type === 'pattern' && (<AlertText val={Messages.addAndEditAddress.streetPattern} />)}
          {errors.street?.type === 'required' && (<AlertText val={Messages.addAndEditAddress.streetRequired} />)}
          {errors.street?.type === 'maxLength' && (<AlertText val={Messages.addAndEditAddress.streetMaxLength} />)}
          <View
            style={[
              StylesGlobal.row,
              Mixins.size('90%', 'auto'),
            ]}
          >
            <Controller
              control={control}
              rules={{
                required: true,
                maxLength: 8,
                pattern: /^[0-9]+$/i,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    StylesGlobal.alignCenterContent,
                    StylesGlobal.bColorPrimary,
                    (errors.externalNumber) ? StylesGlobal.bColorWarning : {},
                    Mixins.borderRad(60),
                    Mixins.size('49%', 50),
                    Mixins.padding(0, 10, 0, 10),
                    Mixins.margin(10, 3, 0, 0),
                  ]}
                >
                  <TextInput
                    style={[
                      StylesGlobal.textGrayDark,
                      Typography.FONT_SIZE_CUSTOM(16),
                      Mixins.size('100%', 50)
                    ]}
                    value={value}
                    maxLength={8}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    allowFontScaling={false}
                    placeholder="Número Exterior"
                    placeholderTextColor={Colors.GRAY_DARK}
                  />
                </View>
              )}
              name="externalNumber"
              defaultValue=""
            />
            <Controller
              control={control}
              rules={{
                required: false,
                maxLength: 8,
                pattern: /^[A-Za-z0-9\s]+$/g,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={[
                    StylesGlobal.alignCenterContent,
                    StylesGlobal.bColorPrimary,
                    (errors.internalNumber) ? StylesGlobal.bColorWarning : {},
                    Mixins.borderRad(60),
                    Mixins.size('49%', 50),
                    Mixins.padding(0, 10, 0, 10),
                    Mixins.margin(10, 0, 0, 3),
                  ]}
                >
                  <TextInput
                    style={[
                      StylesGlobal.textGrayDark,
                      Typography.FONT_SIZE_CUSTOM(16),
                      Mixins.size('100%', 50)
                    ]}
                    value={value}
                    maxLength={8}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    allowFontScaling={false}
                    placeholder="Número Interior"
                    placeholderTextColor={Colors.GRAY_DARK}
                  />
                </View>
              )}
              name="internalNumber"
              defaultValue=""
            />
          </View>
          {errors.externalNumber?.type === 'required' && (<AlertText val={Messages.addAndEditAddress.externalNumberRequired} />)}
          {errors.externalNumber?.type === 'pattern' && (<AlertText val={Messages.addAndEditAddress.externalNumberPattern} />)}
          {errors.internalNumber?.type === 'pattern' && (<AlertText val={Messages.addAndEditAddress.internalNumberPattern} />)}
          <Controller
            control={control}
            rules={{
              required: true,
              maxLength: 5,
              pattern: /^[0-9]+$/i,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  StylesGlobal.alignCenterContent,
                  StylesGlobal.bColorPrimary,
                  (errors.postalCode) ? StylesGlobal.bColorWarning : {},
                  Mixins.borderRad(60),
                  Mixins.size('90%', 50),
                  Mixins.padding(0, 10, 0, 10),
                  Mixins.margin(10, 0, 0, 0),
                ]}
              >
                <TextInput
                  style={[
                    StylesGlobal.textGrayDark,
                    Typography.FONT_SIZE_CUSTOM(16),
                    Mixins.size('100%', 50)
                  ]}
                  value={value}
                  maxLength={5}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onEndEditing={(e) => {
                    if (e.nativeEvent.text.length >= 5) {
                      dispatch(GetSuburbsByZipCode(e.nativeEvent.text));
                    }
                  }}
                  allowFontScaling={false}
                  placeholder="Código Postal"
                  placeholderTextColor={Colors.GRAY_DARK}
                />
              </View>
            )}
            name="postalCode"
            defaultValue=""
          />
          {errors.postalCode?.type === 'pattern' && (<AlertText val={Messages.addAndEditAddress.postalCodePattern} />)}
          {errors.postalCode?.type === 'required' && (<AlertText val={Messages.addAndEditAddress.postalCodeRequired} />)}
          <View
            style={[
              StylesGlobal.alignCenterContent,
              StylesGlobal.bColorPrimary,
              (errors.suburb) ? StylesGlobal.bColorWarning : {},
              Mixins.borderRad(60),
              Mixins.size('90%', 50),
              Mixins.padding(0, 10, 0, 10),
              Mixins.margin(10, 0, 0, 0),
            ]}
          >
            <RNPickerSelect
              style={StylesPickerLocation}
              value={suburbId}
              onValueChange={(e) => { GetCityAndOthersFieldsBySuburbId(e); }}
              placeholder={{
                label: 'Colonia',
                value: 0,
                color: Colors.GRAY_DARK,
              }}
              items={suburbsArr}
            />
          </View>
          <View
            style={[
              StylesGlobal.justifyCenterContent,
              StylesGlobal.bColorPrimary,
              Mixins.borderRad(60),
              Mixins.size('90%', 50),
              Mixins.padding(0, 10, 0, 10),
              Mixins.margin(10, 0, 0, 0),
            ]}
          >
            <TextCustom
              value={(state) || 'Estado'}
              styles={[
                (state) ? StylesGlobal.textBlack : StylesGlobal.textGrayDark,
                Typography.FONT_SIZE_CUSTOM(16),
                Mixins.margin(0, 0, 0, 7),
              ]}
            />
          </View>
          <View
            style={[
              StylesGlobal.justifyCenterContent,
              StylesGlobal.bColorPrimary,
              Mixins.borderRad(60),
              Mixins.size('90%', 50),
              Mixins.padding(0, 10, 0, 10),
              Mixins.margin(10, 0, 0, 0),
            ]}
          >
            <TextCustom
              value={(municipality) || 'Ciudad'}
              styles={[
                (municipality) ? StylesGlobal.textBlack : StylesGlobal.textGrayDark,
                Typography.FONT_SIZE_CUSTOM(16),
                Mixins.margin(0, 0, 0, 7),
              ]}
            />
          </View>
          <View
            style={[
              StylesGlobal.justifyCenterContent,
              StylesGlobal.bColorPrimary,
              Mixins.borderRad(60),
              Mixins.size('90%', 50),
              Mixins.padding(0, 10, 0, 10),
              Mixins.margin(10, 0, 0, 0),
            ]}
          >
            <TextCustom
              value={(municipality) || 'Municipio o  Delegación'}
              styles={[
                (municipality) ? StylesGlobal.textBlack : StylesGlobal.textGrayDark,
                Typography.FONT_SIZE_CUSTOM(16),
                Mixins.margin(0, 0, 0, 7),
              ]}
            />
          </View>
          <Controller
            control={control}
            rules={{
              required: false,
              maxLength: 100,
              pattern: /^[A-Za-z0-9\s]+$/g,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  StylesGlobal.alignCenterContent,
                  StylesGlobal.bColorPrimary,
                  (errors.betStreet) ? StylesGlobal.bColorWarning : {},
                  Mixins.borderRad(60),
                  Mixins.size('90%', 50),
                  Mixins.padding(0, 10, 0, 10),
                  Mixins.margin(10, 0, 0, 0),
                ]}
              >
                <TextInput
                  style={[
                    StylesGlobal.textGrayDark,
                    Typography.FONT_SIZE_CUSTOM(16),
                    Mixins.size('100%', 50)
                  ]}
                  value={value}
                  maxLength={100}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  allowFontScaling={false}
                  placeholder="Entre calle"
                  placeholderTextColor={Colors.GRAY_DARK}
                />
              </View>
            )}
            name="betStreet"
            defaultValue=""
          />
          {errors.betStreet?.type === 'pattern' && (<AlertText val={Messages.addAndEditAddress.betStreetPattern} />)}
          <Controller
            control={control}
            rules={{
              required: false,
              maxLength: 100,
              pattern: /^[A-Za-z0-9\s]+$/g,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  StylesGlobal.alignCenterContent,
                  StylesGlobal.bColorPrimary,
                  (errors.andStreet) ? StylesGlobal.bColorWarning : {},
                  Mixins.borderRad(60),
                  Mixins.size('90%', 50),
                  Mixins.padding(0, 10, 0, 10),
                  Mixins.margin(10, 0, 0, 0),
                ]}
              >
                <TextInput
                  style={[
                    StylesGlobal.textGrayDark,
                    Typography.FONT_SIZE_CUSTOM(16),
                    Mixins.size('100%', 50)
                  ]}
                  value={value}
                  maxLength={100}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  allowFontScaling={false}
                  placeholder="Y calle"
                  placeholderTextColor={Colors.GRAY_DARK}
                />
              </View>
            )}
            name="andStreet"
            defaultValue=""
          />
          {errors.andStreet?.type === 'pattern' && (<AlertText val={Messages.addAndEditAddress.andStreetPattern} />)}
          <Controller
            control={control}
            rules={{
              required: true,
              maxLength: 10,
              pattern: /^[0-9]+$/i
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  StylesGlobal.alignCenterContent,
                  StylesGlobal.bColorPrimary,
                  (errors.phone) ? StylesGlobal.bColorWarning : {},
                  Mixins.borderRad(60),
                  Mixins.size('90%', 50),
                  Mixins.padding(0, 10, 0, 10),
                  Mixins.margin(10, 0, 0, 0),
                ]}
              >
                <TextInput
                  style={[
                    StylesGlobal.textGrayDark,
                    Typography.FONT_SIZE_CUSTOM(16),
                    Mixins.size('100%', 50)
                  ]}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  allowFontScaling={false}
                  placeholder="Teléfono"
                  maxLength={10}
                  placeholderTextColor={Colors.GRAY_DARK}
                />
              </View>
            )}
            name="phone"
            defaultValue=""
          />
          {errors.phone?.type === 'required' && (<AlertText val={Messages.addAndEditAddress.phoneRequired} />)}
          {errors.phone?.type === 'pattern' && (<AlertText val={Messages.addAndEditAddress.phonePattern} />)}
          <Controller
            control={control}
            rules={{
              required: false,
              maxLength: 100,
              pattern: /^[A-ZÀ-ÿa-z0-9\s]+$/g,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  StylesGlobal.alignCenterContent,
                  StylesGlobal.bColorPrimary,
                  (errors.references) ? StylesGlobal.bColorWarning : {},
                  Mixins.borderRad(60),
                  Mixins.size('90%', 50),
                  Mixins.padding(0, 10, 0, 10),
                  Mixins.margin(10, 0, 0, 0),
                ]}
              >
                <TextInput
                  style={[
                    StylesGlobal.textGrayDark,
                    Typography.FONT_SIZE_CUSTOM(16),
                    Mixins.size('100%', 50)
                  ]}
                  value={value}
                  maxLength={100}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  allowFontScaling={false}
                  placeholder="Referencias"
                  placeholderTextColor={Colors.GRAY_DARK}
                />
              </View>
            )}
            name="references"
            defaultValue=""
          />
          {errors.references?.type === 'pattern' && (<AlertText val={Messages.addAndEditAddress.referencesPattern} />)}
          <ButtonCustom
            stylesContainer={[
              StylesGlobal.alignCenterContent,
              StylesGlobal.bgColorSecondary,
              Mixins.borderRad(60),
              Mixins.size('90%', 45),
              Mixins.margin(20, 0, 40, 0),
            ]}
            val="CONTINUAR"
            stylesItem={[
              StylesGlobal.textPrimary,
              Typography.FONT_SIZE_CUSTOM(16),
            ]}
            onClick={handleSubmit(onSubmit)}
          />
        </View>
      </ScrollView>
      <MapModal
        showModal={showMapModal}
        coords={coords}
        OnDragEnd={(e) => {
          setCoords({
            latitude: e.nativeEvent.coordinate.latitude,
            longitude: e.nativeEvent.coordinate.longitude,
          });
        }}
        titleBtn={(route.params) ? "ACTUALIZAR" : "GUARDAR"}
        OnComplete={OnRegister}
      />
      <Alerta
        ShowAlert={showAlert}
        Title={titleMessage}
        Messages={messageAlert}
        ShowCancel={false}
        TextConfirm="Aceptar"
        OnConfirm={() => {
          setShowAlert(false);
        }}
      />
    </View>
  )
}
